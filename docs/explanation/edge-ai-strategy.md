# Explanation: Edge AI Strategy

The DEVI platform accelerates the inherently manual process of inventory ingestion by deploying an Optical Character Recognition (OCR) pipeline. This document clarifies the architectural decision to execute inference directly on the edge clients rather than utilizing cloud-based AI providers.

## The WebAssembly (WASM) Transformer Architecture

Modern machine learning models are typically deployed on high-performance GPU clusters. However, transmitting high-resolution supplier invoices to an external API (such as OpenAI or a cloud-hosted PaddleOCR instance) introduces several critical vulnerabilities.

### Mitigation of Network Latency
Supplier invoices often contain hundreds of line items. Transmitting high-fidelity images over volatile networks, awaiting remote inference, and processing the serialized return payload introduces significant, blocking delays into the pharmacy's operational workflow.

### Preservation of Data Sovereignty
Supplier invoices inherently contain proprietary financial data, negotiated bulk-purchasing discounts, and sensitive corporate metadata. Transmitting this data to third-party inference APIs violates core tenets of enterprise data sovereignty and introduces compliance liabilities.

## Implementation Mechanics

To circumvent these limitations, the DEVI platform utilizes `@xenova/transformers`, an implementation of the HuggingFace Transformers library compiled entirely for WebAssembly.

1. **Local Model Execution:** Upon initializing the `/inventory/onboarding` view, a background Web Worker downloads the `donut-base-finetuned-cord-v2` model weights directly to the client's local cache.
2. **Zero-Latency Inference:** When the cashier captures a photograph via the native `@capacitor/camera` plugin, the image matrix is passed to the Web Worker. The neural network processes the image using the device's localized hardware (CPU/GPU) without initiating a single network request.
3. **Structured Extraction:** The WASM model parses the visual topology of the invoice and returns structured JSON defining the line items, quantities, and batch numbers, ready for immediate ledger synchronization.

This architectural decision guarantees total data privacy, eliminates ongoing cloud inference costs, and ensures the AI pipeline remains functional during network outages.
