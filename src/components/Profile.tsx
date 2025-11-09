import { useState, useEffect } from 'react';
import { User, Upload, Loader } from 'lucide-react';
import { supabase } from '../lib/supabase';

type Profile = {
  id: string;
  email: string | null;
  profile_picture_url: string | null;
};

export default function Profile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (!data) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{ id: user.id, email: user.email }]);

        if (insertError) throw insertError;

        setProfile({ id: user.id, email: user.email, profile_picture_url: null });
      } else {
        setProfile(data);
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);
      setError('');

      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        setError('Please upload an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}/profile.${fileExt}`;

      if (profile?.profile_picture_url) {
        const oldPath = profile.profile_picture_url.split('/').slice(-2).join('/');
        await supabase.storage
          .from('profile-pictures')
          .remove([oldPath]);
      }

      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ profile_picture_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, profile_picture_url: publicUrl } : null);
    } catch (err: any) {
      setError(err.message || 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 w-80">
      <div className="text-center">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Profile</h3>

        <div className="flex justify-center mb-6">
          <div className="relative">
            <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center shadow-md">
              {profile?.profile_picture_url ? (
                <img
                  src={profile.profile_picture_url}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-16 h-16 text-blue-600" />
              )}
            </div>
            {uploading && (
              <div className="absolute inset-0 bg-white bg-opacity-75 rounded-full flex items-center justify-center">
                <Loader className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
            )}
          </div>
        </div>

        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">Email</p>
          <p className="text-gray-900 font-medium truncate">{profile?.email || 'Loading...'}</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-600">{error}</p>
          </div>
        )}

        <label className="block">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            disabled={uploading}
            className="hidden"
          />
          <div className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all duration-200 shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
            <Upload className="w-5 h-5" />
            {uploading ? 'Uploading...' : 'Upload Profile Picture'}
          </div>
        </label>

        <p className="text-xs text-gray-500 mt-3">
          Max file size: 5MB
        </p>
      </div>
    </div>
  );
}
