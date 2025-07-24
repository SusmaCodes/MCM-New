// Add this to the end of your NotificationSettingsDialog.tsx file
// Replace the existing export at the bottom

// Your existing NotificationSettingsDialog component (the one with the Dialog)
const NotificationSettingsDialog: React.FC = () => {
  // ... your existing NotificationSettingsDialog code
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  const { addNotification, inAppEnabled, setInAppEnabled } = useNotifications();

  // Set up notification service
  useEffect(() => {
    NotificationService.setInAppNotifier(addNotification);
  }, [addNotification]);

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
      setNotificationsEnabled(Notification.permission === 'granted');
    }
  }, [isDialogOpen]);

  const handleNotificationToggle = async (enabled: boolean) => {
    if (enabled) {
      try {
        const permission = await Notification.requestPermission();
        setPermission(permission);
        setNotificationsEnabled(permission === 'granted');

        if (permission === 'granted') {
          toast.success('✅ Notifications enabled successfully!');
          
          // Send dual notification (both browser and in-app)
          NotificationService.sendDualNotification({
            title: 'MCM Alerts',
            message: 'Great! You will now receive notifications from MCM Alerts 🔔',
            type: 'success',
            browserOptions: {
              tag: 'welcome',
              data: { url: '/' }
            },
            inAppOptions: {
              autoClose: 5000
            }
          });
        } else {
          toast.error('❌ Please click "Allow" in the browser dialog to enable notifications');
        }
      } catch (error) {
        console.error('Error requesting notification permission:', error);
        toast.error('Failed to request notification permission. Please try again.');
      }
    } else {
      setNotificationsEnabled(false);
      toast.success('Notifications have been disabled');
    }
  };

  const sendTestNotification = async () => {
    // Always show in-app test notification
    addNotification({
      title: '🔔 Test Notification',
      message: 'This is a test notification from MCM Alerts! Everything is working perfectly. 🚀',
      type: 'success',
      autoClose: 5000
    });

    // Also try browser notification if enabled
    if (Notification.permission === 'granted') {
      try {
        await sendNotificationToServiceWorker({
          type: 'SHOW_NOTIFICATION',
          title: '🔔 Test Notification',
          body: 'This is a test notification from MCM Alerts! Everything is working perfectly. 🚀',
          icon: '/mcm-logo-192.png',
          tag: 'test',
          requireInteraction: false,
          data: { url: '/dashboard', priority: 'medium' }
        });
      } catch (error) {
        console.error('Failed to send browser notification:', error);
      }
    }

    // Sound playback
    if (soundEnabled) {
      try {
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.3);
      } catch {
        // Fail silently if AudioContext is unavailable
      }
    }

    toast.success('✅ Test notification sent successfully!');
  };

  const getStatusBadge = () => {
    switch (permission) {
      case 'granted':
        return <Badge className="bg-green-100 text-green-800">✅ Enabled</Badge>;
      case 'denied':
        return <Badge variant="destructive">❌ Blocked</Badge>;
      default:
        return <Badge variant="outline">⏳ Not Set</Badge>;
    }
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Open Notification Settings">
          <Settings className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Settings
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium">Browser Notifications</p>
              <p className="text-sm text-gray-600">
                Status: {getStatusBadge()}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-blue-600" />
              <div>
                <Label htmlFor="notifications" className="font-medium">
                  Browser Notifications
                </Label>
                <p className="text-sm text-gray-600">
                  Get notified about important alerts
                </p>
              </div>
            </div>
            <Switch
              id="notifications"
              checked={notificationsEnabled}
              onCheckedChange={handleNotificationToggle}
              aria-checked={notificationsEnabled}
              role="switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Bell className="h-5 w-5 text-purple-600" />
              <div>
                <Label htmlFor="inapp" className="font-medium">
                  In-App Notifications
                </Label>
                <p className="text-sm text-gray-600">Show notifications while using the app</p>
              </div>
            </div>
            <Switch
              id="inapp"
              checked={inAppEnabled}
              onCheckedChange={setInAppEnabled}
              aria-checked={inAppEnabled}
              role="switch"
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Volume2 className="h-5 w-5 text-green-600" />
              <div>
                <Label htmlFor="sound" className="font-medium">
                  Notification Sounds
                </Label>
                <p className="text-sm text-gray-600">Play sound with notifications</p>
              </div>
            </div>
            <Switch
              id="sound"
              checked={soundEnabled}
              onCheckedChange={setSoundEnabled}
              aria-checked={soundEnabled}
              role="switch"
            />
          </div>

          <div className="pt-4 border-t">
            <Button
              onClick={sendTestNotification}
              className="w-full"
              variant="outline"
              aria-label="Send Test Notification"
            >
              🔔 Send Test Notification
            </Button>
          </div>

          {permission === 'denied' && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
              <p className="text-sm text-red-800">
                <strong>Notifications Blocked:</strong> Click the lock icon in your browser's
                address bar and allow notifications, then refresh the page.
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

// Export both named and default exports to support different import patterns
export { NotificationSettingsDialog };
export default NotificationSettingsDialog;

// Keep your other exports
export { NotificationProvider, useNotifications, NotificationService };
