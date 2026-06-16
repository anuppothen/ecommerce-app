# -- Stage 1: Base ----------------------
# Python 3.13 slim is smaller than the full image
FROM python:3.13-slim

# Set the working directory inside the container
WORKDIR /app

# -- Stage 2: Dependencies --------------
# Copy requirements first for layer caching
# If requirements.txt hasn't changed Docker skips pip install
COPY requirements.txt .

# Install dependencies
RUN pip  install --no-cache-dir -r requirements.txt

# -- Stage 3: Application Code -----------
COPY main.py .
COPY app/ ./app/

# -- Stage 4: Configuration --------------
EXPOSE 3004

# -- Stage 5: Start ----------------------
# User uvicorn to run the FastAPI app
# --host 0.0.0.0 makes it accessible outside the container
# (default is 127.0.0.1 which is only accessible inside the container)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "3004"]