cd frontend && npm install && npm run build 

cd ../emulator && npm install 

cd ../backend && npm install && npx prisma generate 


# nohup npm run start &