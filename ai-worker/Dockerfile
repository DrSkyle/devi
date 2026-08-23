# Base image for Python AI worker
FROM python:3.11-slim

# Install system dependencies for scientific computing
RUN apt-get update && apt-get install -y \
    build-essential \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the service code
COPY . .

# Expose the gRPC port
EXPOSE 50051

# Run the gRPC server
CMD ["python", "server.py"]