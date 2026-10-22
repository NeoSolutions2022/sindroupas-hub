FROM python:3.12-slim
WORKDIR /app
COPY services/intelligence/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY services/intelligence/ ./
RUN useradd --uid 10001 --create-home app && mkdir /data && chown app /data
USER app
ENV DATA_PATH=/data/intelligence.sqlite
EXPOSE 8080
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8080", "--workers", "1"]
