import fs from 'fs';

const files = [
  'public/assets/environment/enviourment.glb',
  'public/assets/cars/car1.glb',
  'public/assets/cars/car2.glb',
  'public/assets/cars/car3.glb',
  'public/assets/cars/car4.glb',
  'public/assets/cars/car5.glb',
  'public/assets/cars/car6.glb'
];

for (const f of files) {
  if (fs.existsSync(f)) {
    const sz = fs.statSync(f).size;
    console.log(f, (sz / (1024 * 1024)).toFixed(2) + ' MB');
  }
}

