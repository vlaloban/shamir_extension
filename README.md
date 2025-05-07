# Shamir Backup Tool

## Overview

Shamir Backup Tool is a web-based application that allows users to securely split and recover secret phrases using Shamir's Secret Sharing scheme. This tool is designed to enhance the security of sensitive information by dividing it into multiple shares, which can be distributed and stored separately.

## What is Shamir's Secret Sharing?

Shamir's Secret Sharing is a cryptographic algorithm created by Adi Shamir. It allows a secret to be divided into parts, giving each participant its own unique part. To reconstruct the original secret, a minimum number of parts (threshold) is required. This method is widely used for secure data backup and recovery.

### Mathematical Background

The algorithm is based on polynomial interpolation over a finite field (GF(256)). The secret is represented as the constant term of a polynomial, and each share is a point on this polynomial. The polynomial is constructed such that it can be reconstructed using any subset of shares that meets the threshold.

## Features

- **Split Secret**: Divide a secret phrase into multiple shares.
- **Recover Secret**: Reconstruct the original secret from a subset of shares.
- **Secure**: Uses cryptographic methods to ensure data integrity and confidentiality.

## How to Use

1. **Split a Secret**:
   - Enter your secret phrase in the "Phrase" field.
   - Specify the total number of shares and the threshold for recovery.
   - Click "Generate" to create the shares.
   - Copy the shares using the "Copy All" button.

2. **Recover a Secret**:
   - Paste the required number of shares into the "Paste shares" field.
   - Click "Recover" to reconstruct the original secret.

## Installation

To use the Shamir Backup Tool, simply clone the repository and open `popup.html` in your web browser.

```bash
git clone <repository-url>
cd <repository-directory>
open popup.html
```

## License

This project is licensed under the MIT License. 