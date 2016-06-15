FROM ubuntu:latest
MAINTAINER Dickson Ukang'a <ukanga@gmail.com>

RUN apt-get update -y
RUN apt-get install -y python-pip python-dev build-essential git-core && \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
COPY requirements.pip /tmp/requirements.pip
RUN pip install --upgrade pip && pip install -r /tmp/requirements.pip
RUN git clone https://github.com/goodbotai/sofia.git /srv/sofia
RUN chmod +x /srv/sofia/start.sh
WORKDIR /srv/sofia

CMD ["./start.sh"]
