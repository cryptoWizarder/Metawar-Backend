@echo off

openssl ecparam -genkey -name secp521r1 -noout -out certs\es512-private.pem
openssl ec -in certs\es512-private.pem -pubout -out certs\es512-public.pem
