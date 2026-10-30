"""
Generates a lightweight placeholder ONNX model for AgriScan on-device inference testing.
Produces public/models/model_int8.onnx, config.json, and labels.json.

Input shape: [1, 3, 224, 224] (NCHW float32)
Output shape: [1, num_classes] (logits float32)
"""

import os
import json
import numpy as np
import onnx
from onnx import helper, TensorProto

LABELS = [
    "early_blight",
    "late_blight",
    "healthy",
    "unknown"
]

CONFIG = {
    "temperature": 1.0,
    "minConf": 0.55,
    "minMargin": 0.15,
    "maxEntropy": 0.80,
    "unknownClass": "unknown",
    "inputSize": 224,
    "mean": [0.485, 0.456, 0.406],
    "std": [0.229, 0.224, 0.225],
    "modelVersion": "0.1.0-placeholder"
}

def generate_placeholder_model(output_path: str):
    # Inputs & outputs
    input_tensor = helper.make_tensor_value_info('input', TensorProto.FLOAT, [1, 3, 224, 224])
    output_tensor = helper.make_tensor_value_info('logits', TensorProto.FLOAT, [1, len(LABELS)])

    # Weight and bias for Linear projection from GlobalAveragePool (3 features -> 4 classes)
    # Using fixed deterministic weights
    np.random.seed(42)
    weight_data = np.array([
        [ 1.8, -0.6, -1.2, -0.5],
        [-0.4,  1.5, -0.8, -0.2],
        [-1.1, -0.7,  1.9, -0.4]
    ], dtype=np.float32) # [3, 4]
    
    bias_data = np.array([0.2, -0.1, 0.3, -0.4], dtype=np.float32) # [4]

    weight_init = helper.make_tensor(
        name='fc_weights',
        data_type=TensorProto.FLOAT,
        dims=[3, 4],
        vals=weight_data.flatten().tolist()
    )
    bias_init = helper.make_tensor(
        name='fc_bias',
        data_type=TensorProto.FLOAT,
        dims=[4],
        vals=bias_data.flatten().tolist()
    )

    # Nodes:
    # 1. GlobalAveragePool: [1, 3, 224, 224] -> [1, 3, 1, 1]
    pool_node = helper.make_node(
        'GlobalAveragePool',
        inputs=['input'],
        outputs=['pooled']
    )

    # 2. Flatten: [1, 3, 1, 1] -> [1, 3]
    flatten_node = helper.make_node(
        'Flatten',
        inputs=['pooled'],
        outputs=['flattened'],
        axis=1
    )

    # 3. Gemm: [1, 3] * [3, 4] + [4] -> [1, 4]
    gemm_node = helper.make_node(
        'Gemm',
        inputs=['flattened', 'fc_weights', 'fc_bias'],
        outputs=['logits'],
        alpha=1.0,
        beta=1.0,
        transA=0,
        transB=0
    )

    graph_def = helper.make_graph(
        nodes=[pool_node, flatten_node, gemm_node],
        name='AgriScanPlaceholderNet',
        inputs=[input_tensor],
        outputs=[output_tensor],
        initializer=[weight_init, bias_init]
    )

    model_def = helper.make_model(graph_def, producer_name='AgriScan-ML-Placeholder')
    model_def.ir_version = 8
    model_def.opset_import[0].version = 13
    onnx.checker.check_model(model_def)

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    onnx.save(model_def, output_path)
    print(f"Successfully generated placeholder ONNX model at: {output_path}")

def main():
    root_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
    models_dir = os.path.join(root_dir, 'public', 'models')
    os.makedirs(models_dir, exist_ok=True)

    labels_path = os.path.join(models_dir, 'labels.json')
    with open(labels_path, 'w', encoding='utf-8') as f:
        json.dump(LABELS, f, indent=2)
    print(f"Saved: {labels_path}")

    config_path = os.path.join(models_dir, 'config.json')
    with open(config_path, 'w', encoding='utf-8') as f:
        json.dump(CONFIG, f, indent=2)
    print(f"Saved: {config_path}")

    onnx_path = os.path.join(models_dir, 'model_int8.onnx')
    generate_placeholder_model(onnx_path)

if __name__ == '__main__':
    main()
