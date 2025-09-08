import json
from decimal import Decimal
from django.contrib.sessions.serializers import JSONSerializer as DjangoJSONSerializer
from django.core.signing import JSONSerializer


class DecimalJSONEncoder(json.JSONEncoder):
    """
    Encoder JSON personalizado que maneja objetos Decimal convirtiéndolos a float
    """
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super().default(obj)


class CustomJSONSerializer:
    """
    Serializer personalizado para sesiones que maneja objetos Decimal
    """
    def dumps(self, obj):
        return json.dumps(obj, separators=(',', ':'), cls=DecimalJSONEncoder).encode('latin-1')
    
    def loads(self, data):
        return json.loads(data.decode('latin-1'))
