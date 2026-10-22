FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends fonts-dejavu-core && rm -rf /var/lib/apt/lists/*
COPY services/intelligence/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/intelligence/ ./
RUN useradd --uid 10001 --create-home app
USER app
ENV OPENAI_MODEL=gpt-6.1-sol NEWSLETTER_MODEL=gpt-6.1-sol
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
