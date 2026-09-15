import cv2
import numpy as np
from torchvision import transforms

# Shared transformation pipeline to prevent train-serve skew
default_transform = transforms.Compose([
    transforms.ToTensor(),
    transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
])

def load_and_preprocess_image(img_path, transform=None):
    """
    Loads an image from path, resizes to 256x256, and applies transforms.
    Shared logic between training dataset loading and API inference.
    """
    image = cv2.imread(str(img_path))
    if image is None:
        raise FileNotFoundError(f"Image {img_path} could not be read by cv2.")
    
    image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
    image = cv2.resize(image, (256, 256))
    
    if transform:
        image = transform(image)
    else:
        image = default_transform(image)
        
    return image
