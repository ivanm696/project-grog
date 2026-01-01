import { GeneratedProject } from '../App';

export const createZipArchive = async (
  files: GeneratedProject['files']
): Promise<void> => {
  const JSZip = (await import('jszip')).default;
  const zip = new JSZip();

  files.forEach(({ path, content }) => {
    zip.file(path, content);
  });

  const blob = await zip.generateAsync({ type: 'blob' });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `generated-project-${Date.now()}.zip`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
