(ns net.littleredcomputer.math.api.sicm
  (:require [clojure.pprint :as pp]
            [ring.util
             [response :refer [response content-type]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [compojure.core :refer [defroutes GET]]
            [net.littleredcomputer.math.api.middleware :refer [log-params cached]]
            [sicmutils.examples
             [driven-pendulum :as driven]
             [double-pendulum :as double]
             [rigid-rotation :as rigid]
             [central-potential :as central]]
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
            [:t :dt :A :omega :g :theta :thetaDot])
  (sicm-get "/api/sicm/pendulum/double/evolve" double/evolver
            [:t :dt :g :m1 :l1 :theta :thetaDot :m2 :l2 :phi :phiDot])
  (sicm-get "/api/sicm/rigid/evolve" rigid/evolver
            [:t :dt :A :B :C :theta :phi :psi :thetaDot :phiDot :psiDot])
  (sicm-get "/api/sicm/gravity/evolve" central/evolver
            [:t :dt :M :x0 :y0 :xDot0 :yDot0])
  (GET "/api/sicm/version" []
    (-> "1.0" response text-plain)))

(defservice (-> sicm
                log-params
                wrap-json-response
                (wrap-defaults api-defaults)))
