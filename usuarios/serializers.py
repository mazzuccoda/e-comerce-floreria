from rest_framework import serializers
from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.models import User
from .models import PerfilUsuario


class PerfilUsuarioSerializer(serializers.ModelSerializer):
    """Serializer para el perfil de usuario"""
    
    class Meta:
        model = PerfilUsuario
        fields = [
            'telefono', 'direccion', 'ciudad', 'codigo_postal',
            'fecha_nacimiento', 'recibir_ofertas'
        ]


class UsuarioSerializer(serializers.ModelSerializer):
    """Serializer para el modelo Usuario con perfil"""
    perfil = PerfilUsuarioSerializer(read_only=True)
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name',
            'date_joined', 'perfil'
        ]
        read_only_fields = ['id', 'date_joined']


class RegistroSerializer(serializers.Serializer):
    """Serializer para registro de nuevos usuarios"""
    username = serializers.CharField()
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True, validators=[validate_password])
    password_confirm = serializers.CharField(write_only=True)
    first_name = serializers.CharField(required=False, allow_blank=True)
    last_name = serializers.CharField(required=False, allow_blank=True)
    telefono = serializers.CharField(required=False, allow_blank=True)
    direccion = serializers.CharField(required=False, allow_blank=True)
    ciudad = serializers.CharField(required=False, allow_blank=True)
    codigo_postal = serializers.CharField(required=False, allow_blank=True)
    fecha_nacimiento = serializers.DateField(required=False, allow_null=True)
    recibir_ofertas = serializers.BooleanField(default=True)

    def validate(self, attrs):
        if attrs['password'] != attrs['password_confirm']:
            raise serializers.ValidationError("Las contraseñas no coinciden")
        return attrs

    def create(self, validated_data):
        validated_data.pop('password_confirm')
        password = validated_data.pop('password')
        
        # Separar datos del usuario y del perfil
        perfil_data = {
            'telefono': validated_data.pop('telefono', ''),
            'direccion': validated_data.pop('direccion', ''),
            'ciudad': validated_data.pop('ciudad', ''),
            'codigo_postal': validated_data.pop('codigo_postal', ''),
            'fecha_nacimiento': validated_data.pop('fecha_nacimiento', None),
            'recibir_ofertas': validated_data.pop('recibir_ofertas', True),
        }
        
        # Crear usuario
        usuario = User.objects.create_user(**validated_data)
        usuario.set_password(password)
        usuario.save()
        
        # Actualizar perfil (ya se crea automáticamente por la señal)
        if hasattr(usuario, 'perfil'):
            for key, value in perfil_data.items():
                setattr(usuario.perfil, key, value)
            usuario.perfil.save()
        
        return usuario


class LoginSerializer(serializers.Serializer):
    """Serializer para login de usuarios"""
    username = serializers.CharField()
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        username = attrs.get('username')
        password = attrs.get('password')

        if username and password:
            user = authenticate(username=username, password=password)
            if not user:
                raise serializers.ValidationError('Credenciales inválidas')
            if not user.is_active:
                raise serializers.ValidationError('Cuenta desactivada')
            attrs['user'] = user
            return attrs
        else:
            raise serializers.ValidationError('Debe proporcionar username y password')


class CambiarPasswordSerializer(serializers.Serializer):
    """Serializer para cambiar contraseña"""
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])
    new_password_confirm = serializers.CharField(write_only=True)

    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password_confirm']:
            raise serializers.ValidationError("Las contraseñas nuevas no coinciden")
        return attrs

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Contraseña actual incorrecta")
        return value
