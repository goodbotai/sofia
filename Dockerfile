FROM ubuntu:latest
MAINTAINER Dickson Ukang'a <ukanga@gmail.com>

RUN apt-get update -y
RUN apt-get install -y python-pip python-dev build-essential \
    apt-get clean && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
COPY requirements.pip /tmp/requirements.pip
RUN pip install -r /tmp/requirements.pip
COPY . /srv/sofia
WORKDIR /srv/sofia
ENTRYPOINT ["python"]
CMD ["health_bot.py"]
