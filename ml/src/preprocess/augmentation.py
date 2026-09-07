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
    
    """
    Applies MixUp augmentation: blends two images and their labels linearly.
    """

    if alpha > 0:
        lam = float(torch.distributions.Beta(alpha,alpha).sample().item)
    else:
        lam = 1.0
    
    mixed_image = lam * image1 + (1.0 - lam) * image2

    l1_onehot = to_one_hot(label1, num_classes = num_classes).to(image1.device)
    l2_onehot = to_one_hot(label2, num_classes = num_classes).to(image2.device)

    mixed_label = lam * l1_onehot + (1.0 - lam) * l2_onehot

    return mixed_image, mixed_label

def cutmix(image1,label1,image2,label2,alpha = 1.0, num_classes = 7):

    """
    Applies CutMix augmentation: cuts a rectangular bounding box from image2
    and pastes it onto image1. Label is weighted by pixel area.
    """

    if alpha > 0:
        lam_sample = float(torch.distributions.Beta(alpha,alpha).sample().item())
    else:
        lam_sample = 1.0

    cut_ratio = math.sqrt(1.0 - lam_sample)
    _,h,w = image1.shape

    cut_w = int(w*cut_ratio)
    cut_h = int(h*cut_ratio)
    
    cx = random.randint(0,w-cut_w)
    cy = random.randint(0,h-cut_h)

    x1 = max(0,cx - cut_w // 2)
    y1 = max(0,cy - cut_h//2)
    x2 = min(w,cx+cut_w//2)
    y2 = min(h,cy+cut_h//2)

    mixed_image = image1.clone()
    mixed_image[:, y1:y2, x1:x2] = image2[:, y1:y2, x1:x2]
    actual_patch_area = (x2 - x1) * (y2 - y1)
    total_area = w * h
    lam = 1.0 - (actual_patch_area / total_area)
    l1_onehot = to_one_hot(label1, num_classes=num_classes).to(image1.device)
    l2_onehot = to_one_hot(label2, num_classes=num_classes).to(image2.device)
    mixed_label = lam * l1_onehot + (1.0 - lam) * l2_onehot
    return mixed_image, mixed_label

    