import fse from 'fs-extra';

export default async function getClientFile(clientFilePath) {
  try {
    return await fse.readJson(clientFilePath);
  } catch (err) {
    console.log(err);
    return false;
  }
}
