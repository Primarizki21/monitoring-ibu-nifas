from fastapi import FastAPI

app = FastAPI(
    title="Sistem Monitoring Ibu Nifas",
    description="Backend API untuk pemantauan kesehatan ibu nifas (Pengmas RS-Puskesmas Surabaya)",
    version="0.1.0",
)


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "service": "pengmas-nifas-backend",
        "version": "0.1.0",
    }


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
