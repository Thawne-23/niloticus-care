import * as FileSystem from 'expo-file-system/legacy';

export const persistImage = async (tempUri) => {
  const fileName = tempUri.split('/').pop();
  const permanentDir = FileSystem.documentDirectory + 'history/';

  // Create the directory if it doesn't exist
  const dirInfo = await FileSystem.getInfoAsync(permanentDir);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(permanentDir, { intermediates: true });
  }

  const permanentUri = permanentDir + fileName;
  await FileSystem.copyAsync({
    from: tempUri,
    to: permanentUri,
  });

  return permanentUri;
};
