"""
Custom storage backends for Cloudinary
"""
from cloudinary_storage.storage import MediaCloudinaryStorage
import cloudinary.uploader


class VideoMediaCloudinaryStorage(MediaCloudinaryStorage):
    """
    Storage backend for videos in Cloudinary
    """
    def _upload(self, name, content):
        """Override to upload as video resource type"""
        options = {
            'resource_type': 'video',
            'folder': self._get_upload_folder(name),
        }
        
        # Upload to Cloudinary as video
        response = cloudinary.uploader.upload(content, **options)
        return response['public_id']
