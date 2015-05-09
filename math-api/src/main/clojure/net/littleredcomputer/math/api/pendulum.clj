(ns net.littleredcomputer.math.api.pendulum
  (:require [math.examples.figure-1-7]
            [ring.util.response :refer [response]]
            [ring.util.servlet :refer [defservice]]
            [clojure.tools.logging :as log]
            [ring.middleware.defaults :refer [wrap-defaults api-defaults]]
            [ring.middleware.json :refer [wrap-json-response]]
            [compojure.core :refer [defroutes GET POST]]
            [hiccup.core :refer :all])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(defroutes
  pendulum
  (GET "/api/sicm/pendulum/evolve" {params :params}
       (log/info "params" params)
       (let [args (for [param [:t :A :omega :g :theta0 :thetaDot0]]
                    (Double/valueOf (param params)))]
         (response (apply evolve-pendulum args)))))

(defservice (-> pendulum
                wrap-json-response
                (wrap-defaults api-defaults)))
