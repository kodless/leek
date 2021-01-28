[
  {
    "image": "${IMAGE}",
    "name": "${CONTAINER_NAME}",
    "networkMode": "awsvpc",
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-group": ${AWS_LOG_GROUP},
        "awslogs-region": ${AWS_REGION},
        "awslogs-stream-prefix": "app"
      }
    },
    "environment": ${ENVIRONMENT},
    "ulimits": [
      {
        "name": "nofile",
        "softLimit": 65535,
        "hardLimit": 65535
      }
    ],
    "portMappings": [
      {
        "containerPort": 8000,
        "hostPort": 8000
      },
      {
        "containerPort": 5000,
        "hostPort": 5000
      },
      {
        "containerPort": 9200,
        "hostPort": 9200
      }
    ]
  }
]