(ns net.littleredcomputer.math.api.sicm
  (:require [clojure.pprint :as pp]
            [ring.util
             [response :refer [response content-type]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [compojure.core :refer [defroutes GET POST ANY]]
            [net.littleredcomputer.math.api.middleware :refer [log-params cached]]
            [net.littleredcomputer.math.examples
             [driven-pendulum :as driven]
             [double-pendulum :as double]
             [rigid-rotation :as rigid]]
            [clojure.tools.logging :as log])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(set! *warn-on-reflection* true)

(def ^:private text-plain #(content-type % "text/plain; charset=UTF-8"))

(defmacro sicm-get
  [endpoint f keys]
  "Mount a GET endpoint which will extract the parameters named in keys from
  the request and combine them with the URI of the request to form a cache key.
  Memcache is then consulted and if the value is found, it is served. Otherwise,
  f is called with the double values of the keys (in order), and the result of
  f is served and installed in the cache."
  `(GET ~endpoint request#
     (let [params# (:params request#)
           args# (for [param# ~keys]
                   (Double/parseDouble (param# params#)))]
       (response (cached (assoc params# :uri (:uri request#)) (apply ~f args#))))))

(defroutes
  sicm
  (sicm-get "/api/sicm/pendulum/driven/evolve" driven/evolver
            [:t :dt :A :omega :g :theta0 :thetaDot0])
  (GET "/api/sicm/pendulum/driven/equations" []
    (-> driven/equations (pp/write :stream nil) response text-plain))
  (sicm-get "/api/sicm/pendulum/double/evolve" double/evolver
            [:t :dt :g :m1 :l1 :theta0 :thetaDot0 :m2 :l2 :phi0 :phiDot0])
  (GET "/api/sicm/pendulum/double/equations" []
    (-> double/equations (pp/write :stream nil) response text-plain))
  (sicm-get "/api/sicm/rigid/evolve" rigid/evolver
            [:t :dt :A :B :C :theta0 :phi0 :psi0 :thetaDot0 :phiDot0 :psiDot0])
  (GET "/api/sicm/rigid/equations" []
    (-> rigid/equations (pp/write :stream nil) response text-plain))
  (GET "/api/sicm/version" []
    (-> "1.0" response (content-type "text/plain"))))

(defservice (-> sicm
                log-params
                wrap-json-response
                (wrap-defaults api-defaults)))

