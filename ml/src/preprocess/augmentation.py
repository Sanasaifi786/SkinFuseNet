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

def mixup(image1,label1,image2, label2, alpha = 0.4,num_classes = 7):
    
    if alpha > 0:
        lam = float(torch.distributions.Beta(alpha,alpha).sample().item)
    else:
        lam = 1.0
    
    mixed_image = lam * image1 + (1.0 - lam) * image2

    l1_onehot = to_one_hot(label1, num_classes = num_classes).to(image1.device)
    l2_onehot = to_one_hot(label2, num_classes = num_classes).to(image2.device)

    mixed_label = lam * l1_onehot + (1.0 - lam) * l2_onehot

    return mixed_image, mixed_label