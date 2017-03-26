FROM phusion/baseimage

ENV LANG C.UTF-8
ENV LC_ALL C.UTF-8

RUN apt-get update
RUN apt-get upgrade -y

# Install nodejs
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_5.x | bash -
RUN apt-get install -y nodejs

RUN npm install -g forever

RUN useradd --create-home --home /var/lib/patavi patavi

USER patavi
WORKDIR /var/lib/patavi
ENV HOME /var/lib/patavi

COPY ./* /var/lib/patavi/

RUN npm install --production

CMD ["forever", "worker.js"]
