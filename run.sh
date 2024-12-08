sudo docker run -p 5000:5000 -p 3000:3000 -p 7000:7000 -v $(pwd)/e-voting:/e-voting -it evoting /bin/bash -c "node index"
