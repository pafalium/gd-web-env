#lang racket

(require rosetta)

(require json)

(require web-server/servlet
         web-server/servlet-env
         web-server/dispatch)

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-syntax-rule
  (for-backends backends expr ...)
  (for ([backend (in-list backends)])
    (parameterize ((current-out-backend backend))
      expr ...)))

;(for-backends (list autocad sketchup)
;                (sphere))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define APPLICATION/JSON-MIME-TYPE #"application/json; charset=utf-8")
(define (response/jsexpr jsexpr
                         #:code [code 200]
                         #:message [message #"Okay"]
                         #:seconds [seconds (current-seconds)]
                         #:mime-type [mime-type APPLICATION/JSON-MIME-TYPE]
                         #:headers [headers '()])
  (response/full code message seconds mime-type
                 headers
                 (list (jsexpr->bytes jsexpr))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (convert-xyz xyz-jsexpr)
  (vxyz (first xyz-jsexpr) (second xyz-jsexpr) (third xyz-jsexpr)))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define next-shape-id 0)
(define (get-next-shape-id)
  (let ([id next-shape-id])
    (set! next-shape-id (+ next-shape-id 1))
    id))

(define shapes (make-hash))

(define (set-shape-for-backend shape-id shape [backend (current-out-backend)])
  (hash-update! shapes shape-id
                (lambda (curr)
                  (hash-set! curr backend shape)
                  curr)
                (make-hash)))

(define (resolve-shape id-jsexpr)
  (let ([id-shapes (hash-ref shapes (hash-ref id-jsexpr 'id))])
    (hash-ref id-shapes (current-out-backend))))

(define (clear-shapes)
  (hash-clear! shapes))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define-values (dispatch url)
  (dispatch-rules
   [("corners-box") #:method "post" corners-box]
   [("right-cuboid") #:method "post" right-cuboid-handler]
   [("center-sphere") #:method "post" center-sphere]
   [("centers-cylinder") #:method "post" centers-cylinder]
   [("cone-frustum") #:method "post" cone-frustum-handler]
   [("polygon") #:method "post" polygon-handler]
   [("extrusion") #:method "post" extrusion-handler]
   [("move") #:method "post" move-handler]
   [("rotate") #:method "post" rotate-handler]
   [("erase-all") #:method "get" erase-all]
   [("active-backends") #:method "put" select-backends]))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define selected-backends (list autocad))
(define (str->backend str)
  (case str
    [("autocad") autocad]
    [("sketchup") sketchup]
    [("rhino") rhino]
    [("revit") revit]))

(define (select-backends req)
  (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
         [backends-lst (hash-ref req-json 'backends)]
         [new-backends (map str->backend backends-lst)])
    (set! selected-backends new-backends)
    (response/jsexpr
     #hasheq((succeeded . #t)))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (map-atoms fn lst)
  (cond ((null? lst) lst)
        ((list? lst) (map (lambda (el) (map-atoms fn el)) lst))
        (else (fn lst))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(define (move-multiple shape vec)
  (map-atoms (lambda (shape) (move shape vec)) shape))

(define (rotate-multiple shape ang p0 p1)
  (map-atoms (lambda (shape) (rotate shape ang p0 p1)) shape))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

;;
;;
;; General procedure for these request handlers:
; - Parse request's json
; - Convert parsed json into Rosetta objects
; - Do operation in each backend
;   - Generate id for operation result
;   - Actually perform the operation
;   - Save results for future use
; - Generate response with id of the operation's result
;

(define (corners-box req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))])
        (for-backends selected-backends
                      (set-shape-for-backend id (box p1 p2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (center-sphere req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([c (convert-xyz (hash-ref req-json 'center))]
            [radius (hash-ref req-json 'radius)])
        (for-backends selected-backends
                      (set-shape-for-backend id (sphere c radius)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (centers-cylinder req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))]
            [radius (hash-ref req-json 'radius)])
        (for-backends selected-backends
                      (set-shape-for-backend id (cylinder p1 radius p2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (cone-frustum-handler req)
  (let ([id (get-next-shape-id)])
    (let ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))]
            [r1 (hash-ref req-json 'radBot)]
            [r2 (hash-ref req-json 'radTop)])
        (for-backends selected-backends
                      (set-shape-for-backend id (cone-frustum p1 r1 p2 r2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (right-cuboid-handler req)
  (let ([id (get-next-shape-id)])
    (let  ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([p1 (convert-xyz (hash-ref req-json 'p1))]
            [p2 (convert-xyz (hash-ref req-json 'p2))]
            [width (hash-ref req-json 'width)]
            [height (hash-ref req-json 'height)])
        (for-backends selected-backends
                      (set-shape-for-backend id (right-cuboid p1 width height p2)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (polygon-handler req)
  (let ([id (get-next-shape-id)])
    (let  ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([ps (map convert-xyz (hash-ref req-json 'vertices))])
        (for-backends selected-backends
                      (set-shape-for-backend id (apply polygon ps)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (extrusion-handler req)
  (let ([id (get-next-shape-id)])
    (let  ([req-json (bytes->jsexpr (request-post-data/raw req))])
      (let ([vec (convert-xyz (hash-ref req-json 'vec))])
        (for-backends selected-backends
                      (set-shape-for-backend id (extrusion (resolve-shape (hash-ref req-json 'shape)) vec)))))
    (response/jsexpr
     (hasheq 'id id))))


(define (move-handler req)
  (let ([id (get-next-shape-id)])
    (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
           [vec (convert-xyz (hash-ref req-json 'vec))])
      (for-backends selected-backends
                    (set-shape-for-backend id (map-atoms (lambda (shape)
                                                           (move-multiple (resolve-shape shape) vec))
                                                         (hash-ref req-json 'shape)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (rotate-handler req)
  (let ([id (get-next-shape-id)])
    (let* ([req-json (bytes->jsexpr (request-post-data/raw req))]
           [ang (hash-ref req-json 'ang)]
           [p (convert-xyz (hash-ref req-json 'p))]
           [vec (convert-xyz (hash-ref req-json 'vec))])
      (for-backends selected-backends
                    (set-shape-for-backend id (map-atoms (lambda (shape) (rotate-multiple (resolve-shape shape)
                                                                                 ang p vec))
                                                         (hash-ref req-json 'shape)))))
    (response/jsexpr
     (hasheq 'id id))))

(define (erase-all request)
  (for-backends selected-backends
                (delete-all-shapes))
  (clear-shapes)
  (response/jsexpr
   #hasheq((succeeded . #t))))

;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;
;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;;

(serve/servlet dispatch
               #:extra-files-paths (list (build-path 'same "../dist"))
               #:servlet-path "/"
               #:servlet-regexp #rx"")


