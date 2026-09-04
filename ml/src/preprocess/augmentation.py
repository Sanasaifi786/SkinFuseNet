import math
import random 
import torch
import torch.nn.functional as F
import torchvision.transforms.functional as TF

def to_one_hot(label,num_classes = 7):
    """
    Converts integer or tensor class label to a one-hot float vector.
    """
    if isinstance(label, torch.Tensor) and label.dim() > 0 and label.shape[-1] == num_classes:
        return label.float()
    if not isinstance(label, torch.Tensor):
        label = torch.tensor(label, dtype=torch.long)
    return F.one_hot(label, num_classes=num_classes).float()