import React, { useState } from 'react';
import { StyleSheet, Text, View, Button, Image, ActivityIndicator, Alert, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import Constants from 'expo-constants';

const SERVER_URL = (Constants.expoConfig && Constants.expoConfig.extra && Constants.expoConfig.extra.SERVER_URL) ||
  (Constants.manifest && Constants.manifest.extra && Constants.manifest.extra.SERVER_URL) ||
  'http://127.0.0.1:5001';

const GRAIN_TYPES = ['auto', 'toor', 'chana', 'red_beans', 'kidney_beans', 'moong'];

export default function HomeScreen() {
  const [grainType, setGrainType] = useState('auto');
  const [image, setImage] = useState<string | null>(null);
  const [base64, setBase64] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  async function pickImage(fromCamera = false) {
    try {
      let permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission required', 'Camera or media library permission is required.');
        return;
      }
      const options = { quality: 0.8, base64: true, allowsEditing: true, aspect: [4, 3] as [number, number] };
      let res: ImagePicker.ImagePickerResult | any;

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
      if (!res.canceled) {
        let uri = null, b64 = null;
        if (res.assets && res.assets.length > 0) {
          uri = res.assets[0].uri || null;
          b64 = res.assets[0].base64 || null;
        } else {
          uri = (res as any).uri || null;
          b64 = (res as any).base64 || null;
        }
        setImage(uri);
        setBase64(b64);
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
    <SafeAreaView style={styles.safe}>
      {/* Navbar */}
      <View style={styles.navbar}>
        <Text style={styles.navTitle}>🌾 GrainClassifier</Text>
      </View>
      <ScrollView contentContainerStyle={styles.container}>

        {/* Grain & Picker */}
        <View style={styles.pickerRow}>
          <Text style={styles.pickerLabel}>Select Grain:</Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={grainType}
              onValueChange={v => setGrainType(v as string)}
              style={styles.picker}
              dropdownIconColor="#295238"
            >
              {GRAIN_TYPES.map(g => (
                <Picker.Item
                  label={g}
                  value={g}
                  key={g}
                  color="#1a2a20" // Dark color for grain choices
                />
              ))}
            </Picker>
          </View>
        </View>

        {/* Image Actions */}
        <View style={styles.buttonsRow}>
          <TouchableOpacity style={styles.primaryBtn} onPress={() => pickImage(true)}>
            <Text style={styles.btnText}>Take Photo</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryBtn} onPress={() => pickImage(false)}>
            <Text style={styles.btnText}>Gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Preview */}
        {image
          ? <Image source={{ uri: image }} style={styles.preview} />
          : <Text style={styles.noImage}>No image selected</Text>
        }

        {/* Predict Button */}
        <TouchableOpacity style={styles.actionBtn} onPress={sendForPrediction} disabled={loading}>
          <Text style={styles.btnActionText}>Get Prediction</Text>
        </TouchableOpacity>

        {loading && <ActivityIndicator style={{ marginTop: 20 }} size="large" />}

        {/* Result Box */}
        {result && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Result</Text>
            <Text style={styles.resultText}>Predicted: <Text style={styles.bold}>{result.predicted_class}</Text></Text>
            <Text style={styles.resultText}>Confidence: <Text style={styles.bold}>{Math.round((result.confidence || 0) * 100)}%</Text></Text>
            <Text style={styles.sectionLabel}>Attributes</Text>
            {result.attributes && Object.entries(result.attributes).map(([k, v]) => (
              <Text style={styles.resultText} key={k}>{k}: {String(v)}</Text>
            ))}
            <Text style={styles.sectionLabel}>Probabilities</Text>
            {result.probabilities && Object.entries(result.probabilities).map(([k, v]) => {
              const num = Number(v) || 0;
              return <Text style={styles.resultText} key={k}>{k}: {Math.round(num * 100)}%</Text>;
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: "#f5faf7",
  },
  navbar: {
    height: 56,
    backgroundColor: "#295238",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingHorizontal: 20,
    marginBottom: 0,
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  navTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    letterSpacing: 1,
  },
  container: {
    alignItems: "center",
    padding: 18,
    backgroundColor: "#f5faf7",
    minHeight: "100%",
  },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 6,
  },
  pickerLabel: {
    fontSize: 16,
    marginRight: 14,
    color: "#295238",
    fontWeight: "600",
  },
  pickerWrapper: {
    borderWidth: 1,
    borderColor: "#98bc99",
    borderRadius: 8,
    minWidth: 170,
    backgroundColor: "#eaf7ed",
  },
  picker: {
    color: "#1a2a20",      // Picker’s text color
    fontWeight: "600",
    fontSize: 16,
    backgroundColor: "#eaf7ed",
  },
  buttonsRow: {
    flexDirection: "row",
    marginTop: 10,
    justifyContent: "center",
    marginBottom: 12,
    width: "100%",
  },
  primaryBtn: {
    borderRadius: 8,
    backgroundColor: "#295238",
    paddingVertical: 11,
    paddingHorizontal: 20,
    marginRight: 12,
  },
  secondaryBtn: {
    borderRadius: 8,
    backgroundColor: "#98bc99",
    paddingVertical: 11,
    paddingHorizontal: 20,
  },
  actionBtn: {
    backgroundColor: "#fbb034",
    borderRadius: 8,
    padding: 12,
    marginTop: 18,
    marginBottom: 2,
    width: "70%",
    alignSelf: "center",
  },
  btnText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 16,
    textAlign: "center",
  },
  btnActionText: {
    color: "#295238",
    fontWeight: "700",
    fontSize: 17,
    textAlign: "center",
    letterSpacing: 0.8,
  },
  preview: {
    width: 300,
    height: 225,
    marginTop: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#98bc99",
    shadowColor: "#abc",
    shadowOpacity: 0.15,
    shadowOffset: { width: 0, height: 2 },
  },
  noImage: {
    color: "#888",
    marginTop: 25,
    marginBottom: 8,
    fontSize: 15,
  },
  resultBox: {
    marginTop: 26,
    padding: 16,
    borderWidth: 0,
    borderRadius: 13,
    backgroundColor: "#fff",
    shadowColor: "#98bc99",
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 6,
    width: "97%",
    alignSelf: "center",
  },
  resultTitle: {
    fontWeight: "bold",
    fontSize: 19,
    marginBottom: 6,
    color: "#295238",
    textAlign: "center",
  },
  resultText: {
    fontSize: 16,
    color: "#262626",
    marginBottom: 2,
  },
  bold: {
    fontWeight: "600",
    color: "#295238",
  },
  sectionLabel: {
    marginTop: 13,
    fontWeight: "700",
    fontSize: 15,
    color: "#295238",
  },
});
