const generateDeviceId = () => {
  const timestamp = Date.now().toString(36);
  const randomString = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${randomString}`;
};

const getDeviceIdFromLocalStorage = () => {
  let deviceId = localStorage.getItem("deviceId");

  if (!deviceId) {
    deviceId = generateDeviceId();
    localStorage.setItem("deviceId", deviceId);
  }

  return deviceId;
};

const deviceId_analytics = {
  generateDeviceId,
  getDeviceIdFromLocalStorage,
};

export default deviceId_analytics;
