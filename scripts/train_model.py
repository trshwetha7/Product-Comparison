from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
if str(ROOT) not in sys.path:
    sys.path.insert(0, str(ROOT))

from backend.core import train_model_endpoint

if __name__ == '__main__':
    result = train_model_endpoint(force=True)
    print('Training complete')
    print(result)
