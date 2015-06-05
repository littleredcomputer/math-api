(ns net.littleredcomputer.math.api.stats-servlet
  (:require [ring.util
             [response :refer [response content-type]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [net.littleredcomputer.math.api
             [middleware :refer [log-params]]
             [stats :as s]]
            [compojure.core :refer [defroutes GET]]
            [clojure.tools.logging :as log])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(defroutes
  stats
  (GET "/api/stats/" []
    (response (s/get-stats))))

(defservice (-> stats
                log-params
                wrap-json-response
                (wrap-defaults api-defaults)))
