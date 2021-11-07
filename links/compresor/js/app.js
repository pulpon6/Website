function prepareDownload(allDownloads) {
  allDownloads.forEach(file => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.addEventListener('load', e => prepareImage(e, file.name));
  });
}

function prepareImage(e, fileName) {
  const img = document.createElement('img');
  img.src = e.target ? e.target.result : e;
  img.addEventListener('load', e => setImageSize(e, fileName));
}

function setImageSize(e, fileName) {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  const img = e.target;
  const reSize = percentage.value / 100;
  c.width = img.width * reSize;
  c.height = img.height * reSize;
  ctx.drawImage(img, 0, 0, c.width, c.height);
  c.toBlob(image => downloadImage(image, fileName), 'image/jpeg', 1 * quality.value / 100);
}

function downloadImage(image, fileName) {
  const a = document.createElement('a');
  image = URL.createObjectURL(image);
  a.href = image;
  a.download = fileName;
  images.appendChild(a);
  fillAnchor({
    fileName,
    image,
    a
  });
}

function fillAnchor({
  fileName,
  image,
  a
}) {
  const preview = document.createElement('img');
  const name = document.createElement('i');
  const anchors = [...images.querySelectorAll('a')];
  preview.src = image;
  name.innerText = fileName.split('-').join(' ');
  a.appendChild(preview);
  a.appendChild(name);
  if(anchors.length === [...upload.files].length && (isNewPercentage || isNewQuality)) {
    const names = anchors.map(a => a.querySelector('i').innerText);
    const blobs = anchors.map(a => a.href);
    saveZip(names, blobs);
  }
}

function all() {
  const elements = [...document.querySelectorAll('[hide]')];
  return {
    show() {
      elements.forEach(hide =>
        hide.setAttribute('hide', 'false')
      );
    },
    hide() {
      elements.forEach(hide =>
        hide.setAttribute('hide', 'true')
      );
    }
  }
}

// https://stackoverflow.com/questions/26635627/saving-images-from-url-using-jszip
function insert(names, blobs) {
  function getBinaryFrom(url) {
    return new Promise((resolve, reject) => {
      JSZipUtils.getBinaryContent(url, (err, data) => {
        if(err) reject(err);
        else resolve(data);
      });
    });
  }
  return {
    onZip(zip = new JSZip()) {
      blobs.forEach(
        (blob, i) => 
        zip.file(names[i], getBinaryFrom(blob), {binary:true})
      );
      return zip.generateAsync({type:'blob'});
    }
  }
}

function saveZip(names, blobs) {
  insert(names, blobs).onZip()
  .then(blob => saveAs(blob, `${zipName.value}.zip`));
}

const images = document.getElementById('images');
const download = document.getElementById('download');
const upload = document.getElementById('upload');
const percentage = document.getElementById('percentage');
const quality = document.getElementById('quality');
const zipName = document.getElementById('zipName');
let currentPercentage = percentage.value;
let currentQuality = quality.value;
let isNewPercentage;
let isNewQuality;
let zip;

upload.addEventListener('input', e => {
  images.innerHTML = '';
  document.querySelector('[for="upload"] span').innerText = 'nuevas';
  all().show();
  prepareDownload([...e.target.files]);
});

download.addEventListener('click', e => {
  const downloads = [...images.querySelectorAll('a')];
  const names = downloads.map(d => d.querySelector('i').innerText);
  const blobs = downloads.map(d => d.href);

  isNewPercentage = currentPercentage !== percentage.value;
  isNewQuality = currentQuality !== quality.value;

  if (isNewPercentage || isNewQuality) {
    const files = [...upload.files];

    zip = new JSZip();
    images.innerHTML = '';
    isNewPercentage = percentage.value;
    
    prepareDownload(files); // when this is finished, saveZip
  } else saveZip(names, blobs);
});