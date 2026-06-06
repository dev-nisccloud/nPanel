export const ZEEPO_REPLICATE_OFFICIAL_PRICING = [
    {
        "id": "anthropic/claude-4.5-haiku",
        "prices": [
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 5,
                "unitSize": 1000000
            },
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 1,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "anthropic/claude-4.5-sonnet",
        "prices": [
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 0.015,
                "unitSize": 1000
            },
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 3,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "anthropic/claude-3.7-sonnet",
        "prices": [
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 0.015,
                "unitSize": 1000
            },
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 3,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "anthropic/claude-opus-4.6",
        "prices": [
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 0.025,
                "unitSize": 1000
            },
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 5,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "google/gemini-3.1-pro",
        "prices": [
            {
                "tier": "≤ 200,000",
                "metric": "token_input_count",
                "priceUsd": 2,
                "unitSize": 1000000
            },
            {
                "tier": "≤ 200,000",
                "metric": "token_output_count",
                "priceUsd": 0.012,
                "unitSize": 1000
            },
            {
                "tier": "> 200,000",
                "metric": "token_input_count",
                "priceUsd": 4,
                "unitSize": 1000000
            },
            {
                "tier": "> 200,000",
                "metric": "token_output_count",
                "priceUsd": 0.018,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "google/gemini-2.5-flash",
        "prices": [
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 0.3,
                "unitSize": 1000000
            },
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 2.5,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "google/gemini-3-pro",
        "prices": [
            {
                "tier": "≤ 200,000",
                "metric": "token_input_count",
                "priceUsd": 2,
                "unitSize": 1000000
            },
            {
                "tier": "≤ 200,000",
                "metric": "token_output_count",
                "priceUsd": 0.012,
                "unitSize": 1000
            },
            {
                "tier": "> 200,000",
                "metric": "token_input_count",
                "priceUsd": 4,
                "unitSize": 1000000
            },
            {
                "tier": "> 200,000",
                "metric": "token_output_count",
                "priceUsd": 0.018,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "openai/gpt-5.2",
        "prices": [
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 1.75,
                "unitSize": 1000000
            },
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 0.014,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "openai/gpt-5",
        "prices": [
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 1.25,
                "unitSize": 1000000
            },
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 0.01,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "openai/gpt-5-nano",
        "prices": [
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 0.05,
                "unitSize": 1000000
            },
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 0.4,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "openai/gpt-4o",
        "prices": [
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 0.01,
                "unitSize": 1000
            },
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 2.5,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "deepseek-ai/deepseek-v3",
        "prices": [
            {
                "tier": null,
                "metric": "token_output_count",
                "priceUsd": 1.45,
                "unitSize": 1000000
            },
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 1.45,
                "unitSize": 1000000
            }
        ]
    },
    {
        "id": "openai/gpt-image-2",
        "prices": [
            {
                "tier": "auto",
                "metric": "image_output_count",
                "priceUsd": 0.128,
                "unitSize": 1
            },
            {
                "tier": "low",
                "metric": "image_output_count",
                "priceUsd": 0.012,
                "unitSize": 1
            },
            {
                "tier": "medium",
                "metric": "image_output_count",
                "priceUsd": 0.047,
                "unitSize": 1
            },
            {
                "tier": "high",
                "metric": "image_output_count",
                "priceUsd": 0.128,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/imagen-4-ultra",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.06,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/imagen-4-fast",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.02,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "bytedance/seedream-4.5",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.04,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "black-forest-labs/flux-2-pro",
        "prices": [
            {
                "tier": null,
                "metric": "run_count",
                "priceUsd": 0.015,
                "unitSize": 1
            },
            {
                "tier": null,
                "metric": "image_input_megapixel_count",
                "priceUsd": 0.015,
                "unitSize": 1
            },
            {
                "tier": null,
                "metric": "image_output_megapixel_count",
                "priceUsd": 0.015,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "black-forest-labs/flux-2-max",
        "prices": [
            {
                "tier": null,
                "metric": "run_count",
                "priceUsd": 0.04,
                "unitSize": 1
            },
            {
                "tier": null,
                "metric": "image_input_megapixel_count",
                "priceUsd": 0.03,
                "unitSize": 1
            },
            {
                "tier": null,
                "metric": "image_output_megapixel_count",
                "priceUsd": 0.03,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/nano-banana-2",
        "prices": [
            {
                "tier": "1K",
                "metric": "image_output_count",
                "priceUsd": 0.067,
                "unitSize": 1
            },
            {
                "tier": "2K",
                "metric": "image_output_count",
                "priceUsd": 0.101,
                "unitSize": 1
            },
            {
                "tier": "4K",
                "metric": "image_output_count",
                "priceUsd": 0.151,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/nano-banana-pro",
        "prices": [
            {
                "tier": "1K",
                "metric": "image_output_count",
                "priceUsd": 0.15,
                "unitSize": 1
            },
            {
                "tier": "2K",
                "metric": "image_output_count",
                "priceUsd": 0.15,
                "unitSize": 1
            },
            {
                "tier": "4K",
                "metric": "image_output_count",
                "priceUsd": 0.3,
                "unitSize": 1
            },
            {
                "tier": "fallback",
                "metric": "image_output_count",
                "priceUsd": 0.035,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/nano-banana",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.039,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "xai/grok-imagine-image",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.02,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "openai/gpt-image-1.5",
        "prices": [
            {
                "tier": "auto",
                "metric": "image_output_count",
                "priceUsd": 0.136,
                "unitSize": 1
            },
            {
                "tier": "low",
                "metric": "image_output_count",
                "priceUsd": 0.013,
                "unitSize": 1
            },
            {
                "tier": "medium",
                "metric": "image_output_count",
                "priceUsd": 0.05,
                "unitSize": 1
            },
            {
                "tier": "high",
                "metric": "image_output_count",
                "priceUsd": 0.136,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "prunaai/hidream-l1-fast",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 5,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "prunaai/z-image-turbo",
        "prices": [
            {
                "tier": "0.5",
                "metric": "image_output_megapixel_count",
                "priceUsd": 2.5,
                "unitSize": 1000
            },
            {
                "tier": "1",
                "metric": "image_output_megapixel_count",
                "priceUsd": 5,
                "unitSize": 1000
            },
            {
                "tier": "2",
                "metric": "image_output_megapixel_count",
                "priceUsd": 0.01,
                "unitSize": 1
            },
            {
                "tier": "3",
                "metric": "image_output_megapixel_count",
                "priceUsd": 0.015,
                "unitSize": 1
            },
            {
                "tier": "4",
                "metric": "image_output_megapixel_count",
                "priceUsd": 0.02,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "prunaai/p-video",
        "prices": [
            {
                "tier": "base; 720p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.02,
                "unitSize": 1
            },
            {
                "tier": "draft; 720p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.005,
                "unitSize": 1
            },
            {
                "tier": "base; 1080p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.04,
                "unitSize": 1
            },
            {
                "tier": "draft; 1080p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.01,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "bytedance/seedance-2.0",
        "prices": [
            {
                "tier": "video_in; 480p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.1,
                "unitSize": 1
            },
            {
                "tier": "non_video_in; 480p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.08,
                "unitSize": 1
            },
            {
                "tier": "video_in; 720p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.22,
                "unitSize": 1
            },
            {
                "tier": "non_video_in; 720p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.18,
                "unitSize": 1
            },
            {
                "tier": "video_in; 1080p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.55,
                "unitSize": 1
            },
            {
                "tier": "non_video_in; 1080p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.45,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "bytedance/seedance-1-lite",
        "prices": [
            {
                "tier": "480p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.018,
                "unitSize": 1
            },
            {
                "tier": "720p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.036,
                "unitSize": 1
            },
            {
                "tier": "1080p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.072,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "bytedance/seedance-1-pro",
        "prices": [
            {
                "tier": "480p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.03,
                "unitSize": 1
            },
            {
                "tier": "720p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.06,
                "unitSize": 1
            },
            {
                "tier": "1080p",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.15,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/veo-3.1-fast",
        "prices": [
            {
                "tier": "with_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.15,
                "unitSize": 1
            },
            {
                "tier": "without_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.1,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/veo-3.1",
        "prices": [
            {
                "tier": "with_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.4,
                "unitSize": 1
            },
            {
                "tier": "without_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.2,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/veo-3",
        "prices": [
            {
                "tier": "with_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.4,
                "unitSize": 1
            },
            {
                "tier": "without_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.2,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/veo-3-fast",
        "prices": [
            {
                "tier": "with_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.15,
                "unitSize": 1
            },
            {
                "tier": "without_audio",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.1,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "google/veo-2",
        "prices": [
            {
                "tier": null,
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.5,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "xai/grok-imagine-video",
        "prices": [
            {
                "tier": null,
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.05,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "runwayml/gen-4.5",
        "prices": [
            {
                "tier": null,
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.12,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "wan-video/wan-2.2-i2v-fast",
        "prices": [
            {
                "tier": "base; 480p",
                "metric": "video_output_count",
                "priceUsd": 0.05,
                "unitSize": 1
            },
            {
                "tier": "interpolate; 480p",
                "metric": "video_output_count",
                "priceUsd": 0.065,
                "unitSize": 1
            },
            {
                "tier": "base; 720p",
                "metric": "video_output_count",
                "priceUsd": 0.11,
                "unitSize": 1
            },
            {
                "tier": "interpolate; 720p",
                "metric": "video_output_count",
                "priceUsd": 0.145,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "kwaivgi/kling-v2.1",
        "prices": [
            {
                "tier": "standard",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.05,
                "unitSize": 1
            },
            {
                "tier": "pro",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.09,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "kwaivgi/kling-v2.6",
        "prices": [
            {
                "tier": "no",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.07,
                "unitSize": 1
            },
            {
                "tier": "yes",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.14,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "kwaivgi/kling-v2.5-turbo-pro",
        "prices": [
            {
                "tier": null,
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.07,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "kwaivgi/kling-v3-omni-video",
        "prices": [
            {
                "tier": "no; standard",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.168,
                "unitSize": 1
            },
            {
                "tier": "yes; standard",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.224,
                "unitSize": 1
            },
            {
                "tier": "no; pro",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.224,
                "unitSize": 1
            },
            {
                "tier": "yes; pro",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.28,
                "unitSize": 1
            },
            {
                "tier": "no; 4k",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.42,
                "unitSize": 1
            },
            {
                "tier": "yes; 4k",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.42,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "kwaivgi/kling-v3-video",
        "prices": [
            {
                "tier": "no; standard",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.168,
                "unitSize": 1
            },
            {
                "tier": "yes; standard",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.252,
                "unitSize": 1
            },
            {
                "tier": "no; pro",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.224,
                "unitSize": 1
            },
            {
                "tier": "yes; pro",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.336,
                "unitSize": 1
            },
            {
                "tier": "no; 4k",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.42,
                "unitSize": 1
            },
            {
                "tier": "yes; 4k",
                "metric": "video_output_duration_seconds",
                "priceUsd": 0.42,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "minimax/speech-2.8-hd",
        "prices": [
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 0.1,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "minimax/speech-2.8-turbo",
        "prices": [
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 0.06,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "minimax/speech-02-hd",
        "prices": [
            {
                "tier": null,
                "metric": "token_input_count",
                "priceUsd": 0.1,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "qwen/qwen3-tts",
        "prices": [
            {
                "tier": null,
                "metric": "character_input_count",
                "priceUsd": 0.02,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "vaibhavs10/incredibly-fast-whisper",
        "gpuFallbackUsdPerSecond": 0.000975,
        "prices": []
    },
    {
        "id": "bria/eraser",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.04,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "bria/generate-background",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.04,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "recraft-ai/recraft-crisp-upscale",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 6,
                "unitSize": 1000
            }
        ]
    },
    {
        "id": "qwen/qwen-image-edit-2511",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.03,
                "unitSize": 1
            }
        ]
    },
    {
        "id": "black-forest-labs/flux-1.1-pro",
        "prices": [
            {
                "tier": null,
                "metric": "image_output_count",
                "priceUsd": 0.04,
                "unitSize": 1
            }
        ]
    }
];
export const ZEEPO_REPLICATE_PRICING_BY_ID = new Map(ZEEPO_REPLICATE_OFFICIAL_PRICING.map((m) => [m.id, m]));
