import os
from dotenv import load_dotenv
import asyncio
import sys

# Load dotenv from backend
load_dotenv('backend/.env')

# Add backend to path so imports work
sys.path.append(os.path.join(os.path.dirname(__file__)))

from backend.services.gemini_service import predict_careers

async def test():
    try:
        res = await predict_careers("I am a software engineer with experience in React and Node. What career matches me?")
        print("Success:", res)
    except Exception as e:
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test())
