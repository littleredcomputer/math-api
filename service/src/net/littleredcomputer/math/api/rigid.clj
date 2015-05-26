(ns net.littleredcomputer.math.api.rigid
  (:require [clojure.pprint :as pp]
            [ring.util
             [response :refer [response content-type]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [compojure.core :refer [defroutes GET POST]]
            [net.littleredcomputer.math.api.middleware :refer [cached log-params]]
            [net.littleredcomputer.math.examples
             [rigid-rotation :as rigid]])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(defroutes
  rigid
  (GET "/api/sicm/rigid/help" []
    (-> "here is some rigid help (not)" response (content-type "text/plain")))
  (GET "/api/sicm/rigid/evolve" {uri :uri params :params}
    (let [args (for [param [:t :dt :A :B :C :alphaDot0 :betaDot0 :gammaDot0]]
                 (Double/parseDouble (param params)))]
      (response (cached (assoc params :uri uri) (apply rigid/evolver args)))))
  (GET "/api/sicm/rigid/equations" []
    (-> rigid/equations (pp/write :stream nil) response (content-type "text/plain; charset=utf-8"))))

(defservice (-> rigid
                log-params
                wrap-json-response
                (wrap-defaults api-defaults)))
