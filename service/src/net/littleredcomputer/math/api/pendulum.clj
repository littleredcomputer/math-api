(ns net.littleredcomputer.math.api.pendulum
  (:require [clojure.pprint :as pp]
            [ring.util
             [response :refer [response content-type]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [compojure.core :refer [defroutes GET POST]]
            [net.littleredcomputer.math.api.middleware :refer [log-params cached]]
            [net.littleredcomputer.math.examples
             [driven-pendulum :as driven]
             [double-pendulum :as double]])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(set! *warn-on-reflection* true)

(defroutes
  pendulum
  (GET "/api/sicm/pendulum/help" []
    (-> "here is some help (not)" response (content-type "text/plain")))
  (GET "/api/sicm/pendulum/driven/evolve" {uri :uri params :params}
    (let [args (for [param [:t :dt :A :omega :g :theta0 :thetaDot0]]
                 (Double/parseDouble (param params)))]
      (response (cached (assoc params :uri uri) (apply driven/evolver args)))))
  (GET "/api/sicm/pendulum/driven/equations" []
    (-> driven/equations (pp/write :stream nil) response (content-type "text/plain; charset=UTF-8")))
  (GET "/api/sicm/pendulum/double/evolve" {uri :uri params :params}
    (let [args (for [param [:t :dt :g :m1 :l1 :theta0 :thetaDot0 :m2 :l2 :phi0 :phiDot0]]
                 (Double/parseDouble (param params)))]
      (response (cached (assoc params :uri uri) (apply double/evolver args)))))
  (GET "/api/sicm/pendulum/double/equations" []
    (-> double/equations (pp/write :stream nil) response (content-type "text/plain; charset=UTF-8"))))

(defservice (-> pendulum
              log-params
              wrap-json-response
              (wrap-defaults api-defaults)))

