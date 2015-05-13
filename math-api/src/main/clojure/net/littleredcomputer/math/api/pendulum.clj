(ns net.littleredcomputer.math.api.pendulum
  (:require [clojure.tools.logging :as log]
            [ring.util
             [response :refer [response]]
             [servlet :refer [defservice]]]
            [ring.middleware
             [defaults :refer [wrap-defaults api-defaults]]
             [json :refer [wrap-json-response]]]
            [compojure.core :refer [defroutes GET POST]]
            [hiccup.core :refer :all]
            [net.littleredcomputer.math.examples
             [driven-pendulum :refer [evolve-pendulum]]
             [double-pendulum :refer [evolve-double-pendulum]]])
  (:import [com.google.appengine.api.memcache MemcacheServiceFactory MemcacheService])
  (:gen-class :extends javax.servlet.http.HttpServlet))

(def ^MemcacheService memcache-service (MemcacheServiceFactory/getMemcacheService))

(defroutes
  pendulum
  (GET "/api/sicm/pendulum/evolve" {params :params}
    (log/info "params" params)
    (let [args (for [param [:t :A :omega :g :theta0 :thetaDot0]]
                 (Double/valueOf (param params)))
          key (into params {:kind :driven-pendulum})
          cached (.get memcache-service key)]
      (if cached
        (do
          (log/info "cache hit")
          (response cached))
        (do
          (log/info "cache miss")
          (let [data (apply evolve-pendulum args)]
            (.put memcache-service key data)
            (response data))))))
  ;; Yes, this looks repetitive, but we're just brining up these visualizations
  ;; so I'm waiting to see what should be abstracted.
  (GET "/api/sicm/pendulum/double/evolve" {params :params}
    (log/info "params" params)
    (let [args (for [param [:t :g :m1 :l1 :theta0 :thetaDot0 :m2 :l2 :phi0 :phiDot0]]
                 (Double/valueOf (param params)))
          key (into params {:kind :double-pendulum})
          cached (.get memcache-service key)]
      (if cached
        (do
          (log/info "cache hit")
          (response cached))
        (do
          (log/info "cache miss")
          (let [data (apply evolve-double-pendulum args)]
            (.put memcache-service key data)
            (response data)))))))

(defservice (-> pendulum
                wrap-json-response
                (wrap-defaults api-defaults)))
