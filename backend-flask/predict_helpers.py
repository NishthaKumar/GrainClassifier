import io
from PIL import Image
import torch
from torchvision import transforms

# Class labels the API exposes
CLASS_LABELS = ['toor', 'chana', 'red_beans', 'kidney_beans', 'moong']

# Sample attributes for each class (placeholders for non-toor classes)
CLASS_TO_ATTRIBUTES = {
    'toor': {'color': 'yellow', 'size_mm': 6.5, 'protein_pct': 22.0},
    'chana': {'color': 'beige', 'size_mm': 4.0, 'protein_pct': 20.0},
    'red_beans': {'color': 'red', 'size_mm': 7.0, 'protein_pct': 23.0},
    'kidney_beans': {'color': 'dark red', 'size_mm': 8.0, 'protein_pct': 24.0},
    'moong': {'color': 'green', 'size_mm': 3.5, 'protein_pct': 25.0},
}


def get_preprocess_transform(image_size: int = 224):
    """Return a torchvision transform to preprocess input images.

    Resize to image_size x image_size, convert to tensor and normalize with
    ImageNet mean/std which is a common choice.
    """
    return transforms.Compose([
        transforms.Resize((image_size, image_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225]),
    ])


def pil_from_base64(b64bytes: bytes):
    """Return a PIL.Image from raw base64-decoded bytes."""
    bio = io.BytesIO(b64bytes)
    img = Image.open(bio).convert('RGB')
    return img


def make_probabilities_from_label(selected_label: str, labels=CLASS_LABELS):
    """Create a realistic-looking probabilities dict that sums to 1.

    If selected_label is in labels, give it higher mass and distribute
    the rest evenly. Used for dummy/simulated responses.
    """
    n = len(labels)
    base = 0.05
    probs = {l: base for l in labels}
    remaining = 1.0 - base * n
    if selected_label in probs:
        probs[selected_label] += remaining
    else:
        # distribute equally
        add_each = remaining / n
        for l in probs:
            probs[l] += add_each
    # normalize just in case
    s = sum(probs.values())
    for k in probs:
        probs[k] = round(probs[k] / s, 4)
    # ensure sum to 1.0 (adjust the selected label)
    diff = 1.0 - sum(probs.values())
    probs[selected_label] = round(probs[selected_label] + diff, 4)
    return probs
