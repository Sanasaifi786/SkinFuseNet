import torch
import torch.nn.functional as F
import numpy as np
import cv2
from PIL import Image
import base64
import io

class GradCAM:
    def __init__(self, model, target_layer):
        self.model = model
        self.model.eval()
        self.features = None
        self.gradients = None
        target_layer.register_forward_hook(self._save_features)
        target_layer.register_full_backward_hook(self._save_gradients)
    
    def _save_features(self, module, input, output):
        self.features = output.detach()
    
    def _save_gradients(self, module, grad_input, grad_output):
        self.gradients = grad_output[0].detach()
    
    def generate(self, input_tensor, class_idx=None):
        output = self.model(input_tensor)
        if class_idx is None:
            class_idx = output.argmax(dim=1).item()
        self.model.zero_grad()
        target_score = output[0, class_idx]
        target_score.backward()
        weights = self.gradients.mean(dim=[2, 3], keepdim=True)
        cam = (weights * self.features).sum(dim=1, keepdim=True)
        cam = F.relu(cam)
        cam = F.interpolate(cam, size=(256, 256), mode='bilinear', align_corners=False)
        cam = cam.squeeze()
        cam = (cam - cam.min()) / (cam.max() - cam.min() + 1e-8)
        return cam.cpu().numpy()

def overlay_heatmap(original_image, heatmap, alpha=0.4):
    img = original_image.resize((256, 256))
    img_np = np.array(img)
    heatmap_colored = cv2.applyColorMap(
        (heatmap * 255).astype(np.uint8), cv2.COLORMAP_JET
    )
    heatmap_colored = cv2.cvtColor(heatmap_colored, cv2.COLOR_BGR2RGB)
    overlay = (img_np * (1 - alpha) + heatmap_colored * alpha).astype(np.uint8)
    overlay_pil = Image.fromarray(overlay)
    buffer = io.BytesIO()
    overlay_pil.save(buffer, format='PNG')
    return base64.b64encode(buffer.getvalue()).decode('utf-8')