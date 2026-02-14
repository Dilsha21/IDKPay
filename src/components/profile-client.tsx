'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/app/auth-provider';
import { updateProfile } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Upload, User } from 'lucide-react';
import { DEFAULT_PROFILE_PICTURE } from '@/lib/placeholder-images';

export function ProfileClient() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [contactInfo, setContactInfo] = useState(user?.contactInfo || '');
  const [address, setAddress] = useState(user?.address || '');
  const [collegeName, setCollegeName] = useState(user?.collegeName || '');
  const [department, setDepartment] = useState(user?.department || '');
  const [collegeYear, setCollegeYear] = useState(user?.collegeYear || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync state with user data when it loads
  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setContactInfo(user.contactInfo || '');
      setAddress(user.address || '');
      setCollegeName(user.collegeName || '');
      setDepartment(user.department || '');
      setCollegeYear(user.collegeYear || '');
    }
  }, [user]);

  const PROFESSIONAL_DEFAULT =
    'https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg';

  const [avatarUrl, setAvatarUrl] = useState(
    user?.avatarUrl && user.avatarUrl !== 'default'
      ? user.avatarUrl
      : PROFESSIONAL_DEFAULT
  );

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: 'Invalid file type',
          description: 'Please select an image file.',
          variant: 'destructive',
        });
        return;
      }

      // Check file size (max 2MB before compression)
      if (file.size > 2 * 1024 * 1024) {
        toast({
          title: 'File too large',
          description: 'Please select an image smaller than 2MB.',
          variant: 'destructive',
        });
        return;
      }

      // Compress and convert image
      const reader = new FileReader();
      reader.onload = (e) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');

          // Calculate new dimensions (max 400x400)
          let { width, height } = img;
          const maxSize = 400;

          if (width > height) {
            if (width > maxSize) {
              height *= maxSize / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width *= maxSize / height;
              height = maxSize;
            }
          }

          canvas.width = width;
          canvas.height = height;

          // Draw and compress image
          ctx?.drawImage(img, 0, 0, width, height);

          // Convert to compressed base64 (quality 0.7)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);

          // Check if compressed image is still too large (should be much smaller now)
          const compressedSize = Math.round(compressedDataUrl.length * 0.75); // Approximate size
          if (compressedSize > 500000) { // 500KB limit
            toast({
              title: 'Image too large',
              description: 'Even after compression, the image is too large. Please try a smaller image.',
              variant: 'destructive',
            });
            return;
          }

          setAvatarUrl(compressedDataUrl);
          toast({
            title: 'Image uploaded',
            description: 'Your profile picture has been compressed and updated.',
          });
        };

        img.onerror = () => {
          toast({
            title: 'Upload failed',
            description: 'Failed to process the image file.',
            variant: 'destructive',
          });
        };

        img.src = e.target?.result as string;
      };

      reader.onerror = () => {
        toast({
          title: 'Upload failed',
          description: 'Failed to read the image file.',
          variant: 'destructive',
        });
      };

      reader.readAsDataURL(file);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) return;

    setIsSubmitting(true);

    try {
      const result = await updateProfile({
        uid: user.uid,
        name,
        avatarUrl,
        contactInfo,
        address,
        collegeName,
        department,
        collegeYear,
      });

      if (result.error) {
        toast({
          title: 'Update Failed',
          description: result.error,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Profile Updated!',
          description: 'Your profile has been successfully updated.',
        });
      }
    } catch (error: any) {
      toast({
        title: 'Update Failed',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto p-4 md:p-8">
        <div className="flex items-center justify-center h-64">
          <p>Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Profile Settings
            </CardTitle>
            <CardDescription>
              Update your personal information and profile picture
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture Section */}
            <div className="flex items-center space-x-4">
              <Avatar className="h-20 w-20">
                <AvatarImage
                  src={avatarUrl}
                  alt={name}
                  onError={() => setAvatarUrl(PROFESSIONAL_DEFAULT)}
                />
                <AvatarFallback className="text-lg">
                  {name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="space-y-2">
                <Label htmlFor="avatar-url">Profile Picture URL</Label>
                <div className="flex gap-2">
                  <Input
                    id="avatar-url"
                    type="url"
                    placeholder="https://static.vecteezy.com/system/resources/previews/020/765/399/non_2x/default-profile-account-unknown-icon-black-silhouette-free-vector.jpg"
                    value={avatarUrl}
                    onChange={(e) => setAvatarUrl(e.target.value)}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Display Name</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Email Address</Label>
                <Input
                  type="email"
                  value={user.email}
                  disabled
                  className="bg-muted"
                />
                <p className="text-sm text-muted-foreground">
                  Email cannot be changed. Contact support if needed.
                </p>
              </div>

              {/* College Information Section */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Academic Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="collegeName">College</Label>
                    <Input
                      id="collegeName"
                      type="text"
                      placeholder="College Name"
                      value={collegeName}
                      onChange={(e) => setCollegeName(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="department">Department</Label>
                    <Input
                      id="department"
                      type="text"
                      placeholder="e.g. Computer Science"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="collegeYear">Academic Year</Label>
                    <Input
                      id="collegeYear"
                      type="text"
                      placeholder="e.g. 3rd Year"
                      value={collegeYear}
                      onChange={(e) => setCollegeYear(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">Contact Information</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactInfo">Contact Info</Label>
                    <Input
                      id="contactInfo"
                      type="text"
                      placeholder="Phone or social"
                      value={contactInfo}
                      onChange={(e) => setContactInfo(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      type="text"
                      placeholder="City, Hostel, or Street"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isSubmitting || (
                  name === user.name &&
                  avatarUrl === user.avatarUrl &&
                  contactInfo === (user.contactInfo || '') &&
                  address === (user.address || '') &&
                  collegeName === (user.collegeName || '') &&
                  department === (user.department || '') &&
                  collegeYear === (user.collegeYear || '')
                )}
              >
                {isSubmitting ? 'Updating...' : 'Update Profile'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
