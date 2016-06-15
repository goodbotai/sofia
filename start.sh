#!/bin/bash
git pull
pip install --upgrade pip && pip install -r requirements.pip
python health_bot.py
