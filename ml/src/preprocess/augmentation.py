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


def rspda(image, max_shift_ratio=0.10):
    """
    RSPDA: Rotated and Shifted Patch Data Augmentation.
    Applies discrete 90-degree rotation and random spatial translation.
    """
    angle = random.choice([0, 90, 180, 270])
    if angle != 0:
        transformed_image = TF.rotate(image, angle)
    else:
        transformed_image = image

    _, h, w = transformed_image.shape

    max_dx = int(w * max_shift_ratio)
    max_dy = int(h * max_shift_ratio)

    translate_x = random.randint(-max_dx, max_dx)
    translate_y = random.randint(-max_dy, max_dy)

    transformed_image = TF.affine(
        transformed_image,
        angle=0,
        translate=[translate_x, translate_y],
        scale=1.0,
        shear=0
    )

    return transformed_image


def apply_augmentation(
    image1, label1,
    image2=None, label2=None,
    aug_type="random",
    prob=0.5,
    num_classes=7
):
    """
    Unified augmentation pipeline dispatcher with probability gating.
    """
    if random.random() > prob:
        return image1, to_one_hot(label1, num_classes=num_classes).to(image1.device)
    if aug_type == "random":
        if image2 is not None and label2 is not None:
            chosen = random.choice(["mixup", "cutmix", "rspda"])
        else:
            chosen = "rspda"
    else:
        chosen = aug_type.lower()
    if chosen == "mixup":
        if image2 is None or label2 is None:
            raise ValueError("MixUp requires image2 and label2.")
        return mixup(image1, label1, image2, label2, num_classes=num_classes)
    elif chosen == "cutmix":
        if image2 is None or label2 is None:
            raise ValueError("CutMix requires image2 and label2.")
        return cutmix(image1, label1, image2, label2, num_classes=num_classes)
    elif chosen == "rspda":
        augmented_image = rspda(image1)
        label_onehot = to_one_hot(label1, num_classes=num_classes).to(image1.device)
        return augmented_image, label_onehot
    else:
        return image1, to_one_hot(label1, num_classes=num_classes).to(image1.device)


def batch_augmentation(images, labels, aug_type="random", prob=0.5, num_classes=7):
    """
    Applies augmentations across a mini-batch tensor [B, C, H, W] for training loops.
    """
    batch_size = images.size(0)
    device = images.device

    if random.random() > prob:
        return images, to_one_hot(labels, num_classes=num_classes).to(device)
    rand_indices = torch.randperm(batch_size, device=device)
    shuffled_images = images[rand_indices]
    shuffled_labels = labels[rand_indices]

    if aug_type == "random":
        chosen = random.choice(["mixup", "cutmix", "rspda"])
    else:
        chosen = aug_type.lower()
    if chosen == "mixup":
        lam = float(torch.distributions.Beta(0.4, 0.4).sample().item())
        mixed_images = lam * images + (1.0 - lam) * shuffled_images
        y_a = to_one_hot(labels, num_classes).to(device)
        y_b = to_one_hot(shuffled_labels, num_classes).to(device)
        mixed_labels = lam * y_a + (1.0 - lam) * y_b
        return mixed_images, mixed_labels
    elif chosen == "cutmix":
        lam_sample = float(torch.distributions.Beta(1.0, 1.0).sample().item())
        cut_ratio = math.sqrt(1.0 - lam_sample)
        _, _, h, w = images.shape
        cut_w = int(w * cut_ratio)
        cut_h = int(h * cut_ratio)
        cx = random.randint(0, w)
        cy = random.randint(0, h)
        x1 = max(0, cx - cut_w // 2)
        y1 = max(0, cy - cut_h // 2)
        x2 = min(w, cx + cut_w // 2)
        y2 = min(h, cy + cut_h // 2)
        mixed_images = images.clone()
        mixed_images[:, :, y1:y2, x1:x2] = shuffled_images[:, :, y1:y2, x1:x2]
        lam = 1.0 - ((x2 - x1) * (y2 - y1) / (w * h))
        y_a = to_one_hot(labels, num_classes).to(device)
        y_b = to_one_hot(shuffled_labels, num_classes).to(device)
        mixed_labels = lam * y_a + (1.0 - lam) * y_b
        return mixed_images, mixed_labels
    elif chosen == "rspda":
        augmented_list = [rspda(img) for img in images]
        augmented_images = torch.stack(augmented_list, dim=0)
        return augmented_images, to_one_hot(labels, num_classes=num_classes).to(device)

    return images, to_one_hot(labels, num_classes=num_classes).to(device)
if __name__ == "__main__":

    print("--- Testing Augmentation Pipeline ---")
    img_a = torch.rand(3, 256, 256)
    img_b = torch.rand(3, 256, 256)
    lbl_a = 4  # e.g., Melanoma
    lbl_b = 5  # e.g., Nevus

    # Test MixUp
    m_img, m_lbl = mixup(img_a, lbl_a, img_b, lbl_b)
    print(f"MixUp shape: {m_img.shape}, soft label: {m_lbl}")

    # Test CutMix
    c_img, c_lbl = cutmix(img_a, lbl_a, img_b, lbl_b)
    print(f"CutMix shape: {c_img.shape}, soft label: {c_lbl}")

    # Test RSPDA
    r_img = rspda(img_a)
    print(f"RSPDA shape: {r_img.shape}")

    # Test Unified Dispatcher
    disp_img, disp_lbl = apply_augmentation(img_a, lbl_a, img_b, lbl_b, aug_type="random", prob=1.0)
    print(f"Dispatcher result shape: {disp_img.shape}, label: {disp_lbl}")
    
    # Test Batch Augmentation
    batch_x = torch.rand(8, 3, 256, 256)
    batch_y = torch.randint(0, 7, (8,))
    out_x, out_y = batch_augmentation(batch_x, batch_y, aug_type="random", prob=1.0)
    print(f"Batch augmentation output: images {out_x.shape}, labels {out_y.shape}")
    print("All tests passed successfully!")