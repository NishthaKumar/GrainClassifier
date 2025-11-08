import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Image, ActivityIndicator, Alert, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';

// SERVER_URL is read from app config (loaded from frontend-expo/.env via app.config.js).
// Edit `frontend-expo/.env` to change this value for your device testing.
const SERVER_URL = (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.SERVER_URL) ||
  (Constants.manifest && Constants.manifest.extra && Constants.manifest.extra.SERVER_URL) ||
  'http://127.0.0.1:5001';

const GRAIN_TYPES = ['auto', 'toor', 'chana', 'red_beans', 'kidney_beans', 'moong'];

export default function App() {
  const [grainType, setGrainType] = useState('auto');
  const [image, setImage] = useState(null);
  const [base64, setBase64] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  async function pickImage(fromCamera = false) {
    try {
      let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Camera or media library permission is required.');
        return;
      }

      const options = { quality: 0.6, base64: true, allowsEditing: false, aspect: [4, 3] };
      let res;
      if (fromCamera) {
        const camPerm = await ImagePicker.requestCameraPermissionsAsync();
        if (!camPerm.granted) {
          Alert.alert('Permission required', 'Camera permission is required.');
          return;
        }
        res = await ImagePicker.launchCameraAsync(options);
      } else {
        res = await ImagePicker.launchImageLibraryAsync(options);
      }

      if (!res.cancelled) {
        setImage(res.uri);
        setBase64(res.base64);
        setResult(null);
      }
    } catch (e) {
      Alert.alert('Error', String(e));
    }
  }

  async function sendForPrediction() {
    if (!base64) {
      Alert.alert('No image', 'Please pick or take a photo first.');
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const payload = { grain_type: grainType, image_base64: base64 };
      const resp = await fetch(`${SERVER_URL}/predict`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) {
        const text = await resp.text();
        throw new Error(`Server error: ${resp.status} ${text}`);
      }
      const j = await resp.json();
      setResult(j);
    } catch (e) {
      Alert.alert('Prediction failed', String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>GrainClassifier (Expo)</Text>

      <View style={styles.pickerRow}>
        <Text style={{ marginRight: 8 }}>Grain:</Text>
        <View style={styles.pickerWrapper}>
          <Picker selectedValue={grainType} onValueChange={v => setGrainType(v)}>
            {GRAIN_TYPES.map(g => (
              <Picker.Item label={g} value={g} key={g} />
            ))}
          </Picker>
        </View>
      </View>

      <View style={styles.buttonsRow}>
        <Button title="Take Photo" onPress={() => pickImage(true)} />
        <View style={{ width: 12 }} />
        <Button title="Choose from Gallery" onPress={() => pickImage(false)} />
      </View>

      {image ? <Image source={{ uri: image }} style={styles.preview} /> : <Text style={{ color: '#666' }}>No image selected</Text>}

      <View style={{ marginTop: 12 }}>
        <Button title="Get Prediction" onPress={sendForPrediction} disabled={loading} />
      </View>

      {loading && <ActivityIndicator style={{ marginTop: 12 }} size="large" />}

      {result && (
        <View style={styles.resultBox}>
          <Text style={styles.resultTitle}>Result</Text>
          <Text>Predicted: {result.predicted_class}</Text>
          <Text>Confidence: {Math.round((result.confidence || 0) * 100)}%</Text>
          <Text style={{ marginTop: 8, fontWeight: '600' }}>Attributes:</Text>
          {result.attributes && Object.entries(result.attributes).map(([k, v]) => (
            <Text key={k}>{k}: {String(v)}</Text>
          ))}

          <Text style={{ marginTop: 8, fontWeight: '600' }}>Probabilities:</Text>
          {result.probabilities && Object.entries(result.probabilities).map(([k, v]) => (
            <Text key={k}>{k}: {Math.round(v * 100)}%</Text>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    paddingTop: 60,
    alignItems: 'center',
  },
  title: { fontSize: 20, fontWeight: '700', marginBottom: 12 },
  pickerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: '#ccc', borderRadius: 6, minWidth: 200 },
  buttonsRow: { flexDirection: 'row', marginTop: 8, marginBottom: 12 },
  preview: { width: 300, height: 225, marginTop: 12, borderRadius: 8 },
  resultBox: { marginTop: 16, padding: 12, borderWidth: 1, borderColor: '#ddd', borderRadius: 8, width: '100%' },
  resultTitle: { fontWeight: '700', marginBottom: 6 },
});
