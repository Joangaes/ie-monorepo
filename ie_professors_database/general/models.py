from timestamps.models import  Timestampable
from simple_history.models import HistoricalRecords

class BaseModel(Timestampable):
    history = HistoricalRecords(inherit=True)

    class Meta:
        abstract=True
    