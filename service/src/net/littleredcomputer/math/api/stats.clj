(ns net.littleredcomputer.math.api.stats)

(defonce ^:private counters (atom {}))

(defn get-stats
  []
  (into {} (for [[k v] @counters] [k @v])))

(defn make-counter
  [name]
  (swap! counters
         (fn [c]
           (if-not (contains? c name)
             (assoc c name (atom 0))
             c)))
  (let [counter (@counters name)]
    (fn f
      ([] (f 1))
      ([x] (swap! counter + x)))))

