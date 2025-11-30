"""
Custom storage backends for Cloudinary
"""
from cloudinary_storage.storage import MediaCloudinaryStorage


class VideoMediaCloudinaryStorage(MediaCloudinaryStorage):
    """
    Storage backend for videos in Cloudinary
    """
    def get_upload_options(self, name):
        """Override to set resource_type to 'video'"""
        options = super().get_upload_options(name)
        options['resource_type'] = 'video'
        return options
