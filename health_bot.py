from flask import Flask, request
from urlparse import urlparse
import urllib
import requests
import json
import urlparse
import time
count =0
date = []
hi = [0]
second = [0]
senders = []
rapidpro_value_key = []
post_backs = ["Yes"]
app = Flask(__name__)
VERIFY_TOKEN = "[REPLACE WITH FACEBOOK VERIFY TOKEN]"
ACCESS_TOKEN = "[REPLACE WITH FACEBOOK ACCCESS TOKEN]"
app.config.from_object(__name__)
app.config.from_envvar("HEALTHBOT_SETTINGS", silent=True)
VERIFY_TOKEN = app.config["VERIFY_TOKEN"]
ACCESS_TOKEN = app.config["ACCESS_TOKEN"]


def reply(user_id):
    
    value = rapidpro_value_key[len(rapidpro_value_key)-1]
    web = "http://www.ethioscholarship.com/wp-content/uploads/2016/06/"
    url1 = web + value + ".png"
    url2 = web + value + "-no.png"
    hey = "http://www.ethioscholarship.com/wp-content/uploads/2016/06/514.png"
    data = {
        "recipient": {"id": user_id},
            "message": {"attachment":
                {"type":"template",
                    "payload":{"template_type":"generic",
"elements": [{"title": "Child image 5.14",
             "image_url": url1,
             "subtitle":"child_image",
             "buttons": [{
                         "type": "postback",
                         "title" : "Yes",
                         "payload" : "Yes"}]},
             {"title": "child image ",
             "image_url": url2,
             "subtitle":"child_name",
             "buttons": [{"type": "postback",
                         "title": "No",
                         "payload" :"No"}]}]}}}
                 
                 
                 }
                     resp = requests.post("https://graph.facebook.com/v2.6/me/messages?access_token=" + ACCESS_TOKEN, json=data)
                         """print(resp.content)
                             print data['message']['attachment']['payload']['elements'][0]['buttons'][0]['payload']"""

@app.route('/rapidpro', methods=['GET'])
def handle_verifications():
    """while (second[len(second)-1]== 0):
        date.append(1)
        time.sleep(15)"""
    returned_value = json.dumps({"val": post_backs[len(post_backs)-1]})
    return returned_value



@app.route('/rapidpro', methods=['POST'])
def handle_incoming_messagess():
    
    length= len(eval(request.form["values"]))
    val = (eval(request.form["values"])[length-1]["label"])
    rapidpro_value_key.append(val)
    if (len(senders) >=1):
        reply([len(senders)-1])
    hi.append(1)
    returned_value = json.dumps({"val": post_backs[len(post_backs)-1]})
    print request.form
    return "ok"

@app.route('/facebook', methods=['GET'])
def handle_verification():
    if request.args['hub.verify_token'] == VERIFY_TOKEN:
        return request.args['hub.challenge']
    else:
        return "Invalid verification token"


@app.route('/facebook', methods=['POST'])
def handle_incoming_messages():
    datas = request.json
    print hi
    sender = datas['entry'][0]['messaging'][0]['sender']['id']
    
    post_back = datas['entry'][0]['messaging'][0]
    try:
        val = post_back["postback"]
        post_backs.append(val['payload'])
    except KeyError:
        print "Sorry"
    if (hi[len(hi)-1] ==1):
        second.append(1)
    else:
        second.append(0)
    print second
    length = len(datas['entry'][0]['messaging'])
    senders.append(sender)
    hi.append(0)
    print post_backs
    return "ok"

if __name__ == '__main__':
    app.run(debug=True)
