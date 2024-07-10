import json

from jupyter_server.base.handlers import APIHandler
from jupyter_server.utils import url_path_join
import tornado

class RouteHandler(APIHandler):
    # The following decorator should be present on all verb methods (head, get, post,
    # patch, put, delete, options) to ensure only authorized user can request the
    # Jupyter server
    @tornado.web.authenticated
    def get(self):
      try:
        file_path = r"/tmp/exchange/databrix_user_credential.json"
        with open(file_path, 'r') as file:
            json_data = json.load(file)

        self.finish(json.dumps(
            json_data
        ))

      except:
         self.finish(json.dumps({
            "dozent": False
        }))

    @tornado.web.authenticated
    def post(self):
        # input_data is a dictionary with a key "name"
      input_data = self.get_json_body()
      username = input_data["username"]
      rolle = input_data["Rolle"]
      if rolle == True:
        try:
          file_path = r"/tmp/exchange/group_info.json"
          with open(file_path, 'r') as file:
              json_data = json.load(file)

          self.finish(json.dumps(
              json_data
          ))
        except:
           self.finish(json.dumps({
              "data": "Error! File not found!"
          }))


      else:
        try:
          file_path = r"/tmp/exchange/group_info.json"
          with open(file_path, 'r') as file:
              json_data = json.load(file)

          group_members = ['unknown']
          group = 'unkonwn'

          for k,v in json_data.items():
            if username in json_data[k]:
              group_members = json_data[k]
              group = k
              break

          self.finish(json.dumps({
              "Ihre Gruppe":[group],
              "Ihre Teammates": group_members,
          }))
        except:
           self.finish(json.dumps({
              "data": "Error! File not found!"
          }))

def setup_handlers(web_app):
    host_pattern = ".*$"

    base_url = web_app.settings["base_url"]
    route_pattern = url_path_join(base_url, "jlab-homepage", "gruppeninfo")
    handlers = [(route_pattern, RouteHandler)]
    web_app.add_handlers(host_pattern, handlers)
