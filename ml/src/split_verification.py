import os
import pandas as pd
from pathlib import Path
from sklearn.model_selection import train_test_split

# Anchor to ml/ directory so this works from any CWD
_ml_dir = Path(__file__).resolve().parents[1]


def verify_splits(csv_path=None):
    if csv_path is None:
        csv_path = str(_ml_dir / "data" / "raw" / "HAM10000_metadata.csv")
    """
    Verifies that the dataset split produces a reproducible 70/20/10 stratified split
    preserving class proportions within +-2% tolerance across all subsets.
    """
    if not os.path.exists(csv_path):
        raise FileNotFoundError(f"Metadata CSV not found at: {csv_path}")

    # 1. Load data
    df = pd.read_csv(csv_path)
    df = df.dropna(subset=["image_id", "dx"]).reset_index(drop=True)
    total_samples = len(df)

    # 2. Perform 70 / 20 / 10 stratified split
    # Step 1: 90% trainval, 10% test
    df_trainval, df_test = train_test_split(
        df,
        test_size=0.10,
        stratify=df["dx"],
        random_state=42
    )

    # Step 2: From the 90% trainval, split 22.22% into val (which equals 20% of total)
    df_train, df_val = train_test_split(
        df_trainval,
        test_size=0.2222,
        stratify=df_trainval["dx"],
        random_state=42
    )

    # 3. Verify total sample counts and percentages
    n_train = len(df_train)
    n_val = len(df_val)
    n_test = len(df_test)

    pct_train = (n_train / total_samples) * 100
    pct_val = (n_val / total_samples) * 100
    pct_test = (n_test / total_samples) * 100

    print("=" * 65)
    print(f"Total dataset: {total_samples} samples")
    print(f"Train set:     {n_train} samples ({pct_train:.2f}%)")
    print(f"Val set:       {n_val} samples ({pct_val:.2f}%)")
    print(f"Test set:      {n_test} samples ({pct_test:.2f}%)")
    print("=" * 65)

    # 4. Class Distribution & Stratification Tolerance Check (+- 2.0%)
    class_order = ["nv", "mel", "bkl", "bcc", "akiec", "vasc", "df"]
    full_dist = df["dx"].value_counts(normalize=True) * 100
    train_dist = df_train["dx"].value_counts(normalize=True) * 100
    val_dist = df_val["dx"].value_counts(normalize=True) * 100
    test_dist = df_test["dx"].value_counts(normalize=True) * 100

    print("\nClass Distribution Comparison:")
    header = f"{'Class':<8} {'Full %':<9} {'Train %':<9} {'Val %':<9} {'Test %':<9} {'Status':<8}"
    print(header)
    print("-" * 65)

    all_proportions_passed = True
    table_rows_markdown = []

    for cls in class_order:
        p_full = full_dist.get(cls, 0.0)
        p_train = train_dist.get(cls, 0.0)
        p_val = val_dist.get(cls, 0.0)
        p_test = test_dist.get(cls, 0.0)

        # Check if train, val, and test all stay within 2% of full distribution
        is_ok = (
            abs(p_train - p_full) <= 2.0
            and abs(p_val - p_full) <= 2.0
            and abs(p_test - p_full) <= 2.0
        )
        status_str = "OK" if is_ok else "FAIL"
        if not is_ok:
            all_proportions_passed = False

        print(f"{cls.upper():<8} {p_full:<9.2f} {p_train:<9.2f} {p_val:<9.2f} {p_test:<9.2f} {status_str:<8}")
        table_rows_markdown.append(
            f"| `{cls.upper()}` | {p_full:.2f}% | {p_train:.2f}% | {p_val:.2f}% | {p_test:.2f}% | {'✅ PASS' if is_ok else '❌ FAIL'} |"
        )

    # 5. Minority Class Counts in Test Set Check (Minimum 5 samples required)
    print("\nMinority Class Counts in Test Set (Requires >= 5 samples):")
    min_required = 5
    minority_passed = True
    minority_report = []

    for cls in ["vasc", "df"]:
        count = int((df_test["dx"] == cls).sum())
        passed = count >= min_required
        if not passed:
            minority_passed = False
        status_str = f"PASS ({count} samples)" if passed else f"FAIL (Only {count} samples)"
        print(f"  {cls.upper()}: {status_str}")
        minority_report.append(f"- **`{cls.upper()}`**: {count} samples ({'✅ PASS' if passed else '❌ FAIL'})")

    # 6. Reproducibility Check (Split 3 times with seed 42)
    print("\nChecking Reproducibility (3 consecutive runs with random_state=42)...")
    run_test_ids = []
    for _ in range(3):
        _, test_subset = train_test_split(df, test_size=0.10, stratify=df["dx"], random_state=42)
        run_test_ids.append(set(test_subset["image_id"].tolist()))

    reproducible = (run_test_ids[0] == run_test_ids[1] == run_test_ids[2])
    print("Reproducibility: " + ("PASS (Identical splits)" if reproducible else "FAIL (Splits differ)"))

    # 7. Write Results Markdown to team/split_verification_results.md
    os.makedirs(str(_ml_dir / "team"), exist_ok=True)
    report_path = str(_ml_dir / "team" / "split_verification_results.md")
    with open(report_path, "w", encoding="utf-8") as f:

        f.write("# SkinFuseNet — Stratified Split Verification Report\n\n")

        f.write("> **Author:** Person C  \n")

        f.write("> **Status:** " + ("✅ ALL CHECKS PASSED\n\n" if (all_proportions_passed and minority_passed and reproducible) else "❌ CHECKS FAILED\n\n"))

        f.write("### 1. Dataset Partition Summary\n\n")

        f.write(f"- **Full Dataset:** {total_samples} images (100%)\n")

        f.write(f"- **Train Set:** {n_train} images ({pct_train:.2f}% target: ~70%)\n")

        f.write(f"- **Validation Set:** {n_val} images ({pct_val:.2f}% target: ~20%)\n")

        f.write(f"- **Test Set:** {n_test} images ({pct_test:.2f}% target: ~10%)\n\n")

        f.write("### 2. Class Distribution Across Splits (±2.0% Tolerance)\n\n")

        f.write("| Class | Full Dataset | Train Set | Val Set | Test Set | Verification |\n")

        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")

        for row in table_rows_markdown:
            f.write(row + "\n")
        f.write("\n### 3. Minority Class Evaluation Readiness\n\n")

        for line in minority_report:
            f.write(line + "\n")
        f.write("\n### 4. Reproducibility\n\n")
        f.write(f"- **Deterministic Seed (42):** {'✅ Confirmed identical across repeated runs.' if reproducible else '❌ Inconsistent.'}\n")

    print(f"\nAudit report successfully written to: {report_path}")
    return all_proportions_passed and minority_passed and reproducible


if __name__ == "__main__":
    success = verify_splits()
    if not success:
        exit(1)
